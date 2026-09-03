import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addProduct,
  updateProduct,
} from "../../features/products/productsSlice";
import useFormSync from "../../hooks/useFormSync";
import { getAssetUrl } from "../../utils/assetUrl";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import { CheckIcon, ImageIcon, PackageIcon, PlusIcon, XIcon } from "../common/Icon";

const MAX_IMAGES = 5;

const ProductModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("In Stock");
  const [categoryId, setCategoryId] = useState("");
  const [subCategory, setSubCategory] = useState("Men");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  // 🆕 Color variants — { name, images (retained URLs), newFiles: [{file, preview, id}] }
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const totalImageCount = existingImages.length + newImages.length;

  const selectedCategory = categories.find((c) => c._id === categoryId);
  // Sirf Men / Women — Uniselect option nahi rahega (requirement ke hisaab se)
  const availableSubCategories = selectedCategory?.subCategories?.length
    ? [...new Set(selectedCategory.subCategories)]
    : ["Men", "Women"];

  // Re-seed form state whenever the drawer opens for a different record,
  // or when categories finish loading (create-mode default category).
  // Render-phase sync via useFormSync — replaces the old setState-in-effect.
  useFormSync(
    `${isOpen}|${editData?._id ?? ""}|${categories.length}`,
    () => {
      if (editData) {
        setName(editData.name || editData.title || "");
        setDescription(editData.description || "");
        setPrice(editData.price || "");
        setStock(editData.stock || "");
        setStatus(editData.isActive !== false ? "In Stock" : "Out of Stock");
        setCategoryId(editData.categoryId?._id || editData.categoryId || "");
        // Purane products agar 'Unisex' the to bhi ab valid option hi pre-select ho
        setSubCategory(
          ["Men", "Women"].includes(editData.subCategory)
            ? editData.subCategory
            : "Men",
        );
        setIsFeatured(!!editData.isFeatured);
        setIsBestSeller(!!editData.isBestSeller);
        setIsNewArrival(!!editData.isNewArrival);
        setExistingImages(editData.images?.desktop || []);
        setNewImages([]);
        setVariants(
          (editData.variants || []).map((v) => ({
            name: v.name || "",
            images: v.images || [],
            newFiles: [],
          })),
        );
      } else {
        setName("");
        setDescription("");
        setPrice("");
        setStock("");
        setStatus("In Stock");
        setCategoryId(categories.length > 0 ? categories[0]._id : "");
        setSubCategory("Men");
        setIsFeatured(false);
        setIsBestSeller(false);
        setIsNewArrival(false);
        setExistingImages([]);
        setNewImages([]);
        setVariants([]);
      }
      setErrors({});
      setTouched({});
    },
  );

  // Object URLs live outside React — free them with a proper cleanup when the
  // modal closes or when a draft image is swapped out.
  useEffect(() => {
    if (!isOpen) return undefined;
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
      variants.forEach((v) =>
        (v.newFiles || []).forEach((img) => URL.revokeObjectURL(img.preview)),
      );
    };
  }, [isOpen, newImages, variants]);

  const getImageError = (existing = existingImages, newImgs = newImages) => {
    const count = existing.length + newImgs.length;
    if (count === 0) return "Please add at least one product image.";
    if (count > MAX_IMAGES)
      return `You can upload up to ${MAX_IMAGES} images only.`;
    return undefined;
  };

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const d = "description" in fields ? fields.description : description;
    const p = "price" in fields ? fields.price : price;
    const s = "stock" in fields ? fields.stock : stock;
    const cat = "categoryId" in fields ? fields.categoryId : categoryId;

    if (!n.trim()) errs.name = "Product name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";

    if (!cat) errs.categoryId = "Please select a category.";

    if (p === "" || p === null || p === undefined)
      errs.price = "Price is required.";
    else if (Number(p) < 0) errs.price = "Price cannot be negative.";

    if (s === "" || s === null || s === undefined)
      errs.stock = "Stock is required.";
    else if (Number(s) < 0) errs.stock = "Stock cannot be negative.";

    const imageErr = getImageError();
    if (imageErr) errs.images = imageErr;

    // 🆕 Variant validation — names unique hone chahiye
    const vNames = variants
      .map((v) => v.name.trim().toLowerCase())
      .filter(Boolean);
    if (new Set(vNames).size !== vNames.length) {
      errs.variants = "Variant names must be unique.";
    }

    return errs;
  };

  /** Live-correct a field only once the user has already left it. */
  const revalidate = (field, value) => {
    if (!touched[field]) return;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const err = (field) => (touched[field] ? errors[field] : undefined);
  const invalid = (field) =>
    touched[field] && errors[field] ? "is-invalid" : "";

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES - totalImageCount;
    if (remainingSlots <= 0) {
      setTouched((prev) => ({ ...prev, images: true }));
      setErrors((prev) => ({
        ...prev,
        images: `You can upload up to ${MAX_IMAGES} images only.`,
      }));
      e.target.value = "";
      return;
    }

    const validFiles = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);

    const added = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    const updatedNewImages = [...newImages, ...added];
    setNewImages(updatedNewImages);

    if (touched.images) {
      const imageErr = getImageError(existingImages, updatedNewImages);
      setErrors((prev) => ({ ...prev, images: imageErr }));
    }

    e.target.value = "";
  };

  const removeExistingImage = (url) => {
    const updated = existingImages.filter((img) => img !== url);
    setExistingImages(updated);
    if (touched.images) {
      const imageErr = getImageError(updated, newImages);
      setErrors((prev) => ({ ...prev, images: imageErr }));
    }
  };

  const removeNewImage = (id) => {
    const target = newImages.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.preview);

    const updated = newImages.filter((img) => img.id !== id);
    setNewImages(updated);
    if (touched.images) {
      const imageErr = getImageError(existingImages, updated);
      setErrors((prev) => ({ ...prev, images: imageErr }));
    }
  };

  /* 🆕 Color variant row handlers */
  const addVariantRow = () =>
    setVariants((prev) => [...prev, { name: "", images: [], newFiles: [] }]);

  const removeVariantRow = (index) => {
    setVariants((prev) => {
      const row = prev[index];
      (row?.newFiles || []).forEach((img) => URL.revokeObjectURL(img.preview));
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateVariantRow = (index, patch) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );

  const addVariantImages = (index, files) => {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    const added = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, newFiles: [...(v.newFiles || []), ...added] } : v,
      ),
    );
  };

  const removeVariantImage = (index, kind, value) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        if (kind === "existing") {
          return { ...v, images: v.images.filter((u) => u !== value) };
        }
        const target = (v.newFiles || []).find((f) => f.id === value);
        if (target) URL.revokeObjectURL(target.preview);
        return {
          ...v,
          newFiles: (v.newFiles || []).filter((f) => f.id !== value),
        };
      }),
    );
  };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      description: true,
      price: true,
      stock: true,
      categoryId: true,
      images: true,
    });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "No description provided");
    formData.append("slug", slug);
    formData.append("price", Number(price));
    formData.append("stock", Number(stock));
    formData.append("categoryId", categoryId);
    formData.append("subCategory", subCategory);
    formData.append("isActive", status !== "Out of Stock");
    formData.append("isFeatured", isFeatured);
    formData.append("isBestSeller", isBestSeller);
    formData.append("isNewArrival", isNewArrival);

    if (!editData) {
      formData.append("sku", `SKU-${Date.now()}`);
    }

    newImages.forEach((img) => formData.append("desktopImages", img.file));

    // 🆕 Variants — rows JSON + nayi files row-order me 'variantImages' field me
    const cleanedVariants = variants.filter((v) => v.name.trim());
    formData.append(
      "variants",
      JSON.stringify(
        cleanedVariants.map((v) => ({
          name: v.name.trim(),
          images: v.images,
          newImageCount: v.newFiles.length,
        })),
      ),
    );
    cleanedVariants.forEach((v) => {
      v.newFiles.forEach((img) => formData.append("variantImages", img.file));
    });

    if (editData) {
      formData.append("retainedDesktopImages", JSON.stringify(existingImages));
    }

    if (editData) {
      dispatch(updateProduct({ id: editData._id, data: formData })).then(
        (res) => {
          if (!res.error) onClose();
        },
      );
    } else {
      dispatch(addProduct(formData)).then((res) => {
        if (!res.error) onClose();
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-xl"
      icon={<PackageIcon className="w-4 h-4" />}
      title={editData ? "Edit product" : "New product"}
      subtitle={
        editData
          ? "Update pricing, stock and imagery for this product."
          : "Add a product to your catalog — images can be reordered later."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner spinner-on-brand" />}
            {loading ? "Saving…" : editData ? "Save changes" : "Create product"}
          </button>
        </>
      }
    >
      <FormAlert>{error}</FormAlert>

      <form
        id="product-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Field
          label="Product name"
          required
          htmlFor="prod-name"
          error={err("name")}
          hint={
            err("name")
              ? undefined
              : name.trim()
                ? `Slug: /${slug}`
                : "Shown on the product card and detail page."
          }
        >
          <input
            id="prod-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              revalidate("name", e.target.value);
            }}
            onBlur={() => handleBlur("name", name)}
            placeholder="e.g. Urban Tech Backpack"
            className={`form-input ${invalid("name")}`}
          />
        </Field>

        <Field
          label="Description"
          required
          htmlFor="prod-desc"
          error={err("description")}
        >
          <textarea
            id="prod-desc"
            rows="3"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              revalidate("description", e.target.value);
            }}
            onBlur={() => handleBlur("description", description)}
            placeholder="Materials, capacity, what makes it worth buying…"
            className={`form-textarea ${invalid("description")}`}
          />
        </Field>

        <div className="form-row">
          <Field
            label="Category"
            required
            htmlFor="prod-category"
            error={err("categoryId")}
          >
            <select
              id="prod-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                const cat = categories.find((c) => c._id === e.target.value);
                const allowed = cat?.subCategories?.length
                  ? [...new Set(cat.subCategories)]
                  : ["Men", "Women"];
                if (!allowed.includes(subCategory)) {
                  setSubCategory(allowed[0] || "Men");
                }
                revalidate("categoryId", e.target.value);
              }}
              onBlur={() => handleBlur("categoryId", categoryId)}
              className={`form-select ${invalid("categoryId")}`}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Sub-category"
            required
            htmlFor="prod-subcategory"
            hint="Limited to what the category allows."
          >
            <select
              id="prod-subcategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="form-select"
            >
              {availableSubCategories.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Collection flags — Shop page filters & badges */}
        <div className="form-row">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Highlights
            </span>
            <div className="flex flex-wrap gap-5 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
                Featured
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
                Best Seller
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
                New Arrival
              </label>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Shop page ke &quot;Collection&quot; filters aur product badges in flags se
              chalte hain.
            </p>
          </div>
        </div>

        <div className="form-row">
          <Field
            label="Price (₹)"
            required
            htmlFor="prod-price"
            error={err("price")}
          >
            <input
              id="prod-price"
              type="number"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                revalidate("price", e.target.value);
              }}
              onBlur={() => handleBlur("price", price)}
              placeholder="1499"
              className={`form-input ${invalid("price")}`}
            />
          </Field>

          <Field
            label="Stock"
            required
            htmlFor="prod-stock"
            error={err("stock")}
            hint={
              err("stock")
                ? undefined
                : Number(stock) === 0 && stock !== ""
                  ? "Shoppers will see this as sold out."
                  : undefined
            }
          >
            <input
              id="prod-stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                revalidate("stock", e.target.value);
              }}
              onBlur={() => handleBlur("stock", stock)}
              placeholder="25"
              className={`form-input ${invalid("stock")}`}
            />
          </Field>
        </div>

        <Field
          label="Visibility"
          htmlFor="prod-status"
          hint="Hidden products stay in the catalog but disappear from the storefront."
        >
          <select
            id="prod-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select"
          >
            <option value="In Stock">Live on storefront</option>
            <option value="Out of Stock">Hidden</option>
          </select>
        </Field>

        {/* 🆕 Color variants — niyabags live site jaisa */}
        <Field
          label="Color variants"
          optional
          error={err("variants")}
          hint="Jaise Black / Brown — har variant ki apni images. Price & stock product-level par hi rehte hain."
        >
          {variants.length > 0 && (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="rounded-(--radius) border border-(--border) bg-(--surface-sunken) p-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) =>
                        updateVariantRow(i, { name: e.target.value })
                      }
                      placeholder="Variant name e.g. Black"
                      className="form-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantRow(i)}
                      className="icon-btn icon-btn-delete"
                      title="Remove variant"
                      aria-label={`Remove variant ${v.name || i + 1}`}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(v.images.length > 0 || v.newFiles.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {v.images.map((url) => (
                        <div key={url} className="relative">
                          <img
                            src={getAssetUrl(url)}
                            alt=""
                            className="h-12 w-12 rounded border border-(--border) object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(i, "existing", url)}
                            className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                            title="Remove image"
                            aria-label="Remove variant image"
                          >
                            <XIcon className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {v.newFiles.map((img) => (
                        <div key={img.id} className="relative">
                          <img
                            src={img.preview}
                            alt=""
                            className="h-12 w-12 rounded border border-(--border) object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(i, "new", img.id)}
                            className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                            title="Remove image"
                            aria-label="Remove variant image"
                          >
                            <XIcon className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-(--brand)">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addVariantImages(i, Array.from(e.target.files || []));
                        e.target.value = "";
                      }}
                    />
                    <ImageIcon className="w-3.5 h-3.5" /> Add images
                  </label>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addVariantRow}
            className="btn btn-secondary btn-sm mt-2"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add variant
          </button>
        </Field>

        <Field
          label="Product images"
          required
          error={err("images")}
          hint={
            err("images")
              ? undefined
              : "The first image is used as the cover everywhere."
          }
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] text-(--ink-muted)">
              {totalImageCount} of {MAX_IMAGES} used
            </span>
            {totalImageCount > 0 && (
              <span className="text-[11.5px] text-(--ink-faint)">
                Hover a thumbnail to remove it
              </span>
            )}
          </div>

          {totalImageCount > 0 && (
            <div className="thumb-grid">
              {existingImages.map((url, i) => (
                <div key={url} className="thumb">
                  <img src={getAssetUrl(url)} alt={`Product image ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="thumb-remove"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  {i === 0 && <span className="thumb-primary-tag">Cover</span>}
                </div>
              ))}
              {newImages.map((img, i) => (
                <div key={img.id} className="thumb">
                  <img src={img.preview} alt="New upload preview" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(img.id)}
                    className="thumb-remove"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  {existingImages.length === 0 && i === 0 && (
                    <span className="thumb-primary-tag">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalImageCount < MAX_IMAGES ? (
            <div className={`dropzone ${invalid("images")}`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, images: true }));
                  setErrors((prev) => ({ ...prev, images: getImageError() }));
                }}
                aria-label="Product images"
              />
              <ImageIcon className="w-6 h-6 text-(--ink-faint)" />
              <p className="text-[12.5px] font-medium text-(--ink-soft)">
                Click to upload images
              </p>
              <p className="text-[11px] text-(--ink-faint)">
                PNG, JPG or WEBP — {MAX_IMAGES - totalImageCount} slot
                {MAX_IMAGES - totalImageCount === 1 ? "" : "s"} left
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-(--radius) bg-(--surface-sunken) border border-(--border)">
              <CheckIcon className="w-4 h-4 text-(--success)" />
              <p className="text-[12px] text-(--ink-muted)">
                All {MAX_IMAGES} slots filled — remove one to swap in a new
                image.
              </p>
            </div>
          )}
        </Field>
      </form>
    </Drawer>
  );
};

export default ProductModal;

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

// Collections normalise — populated objects ({ _id, name }) ya plain ids
// dono se ObjectId strings ki clean array banao.
const toCollectionIds = (collections) =>
  (Array.isArray(collections) ? collections : [])
    .map((c) =>
      typeof c === "object" && c?._id ? String(c._id) : String(c || ""),
    )
    .filter(Boolean);

const ProductModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  // 🆕 Collections ab Collections section (naya) se aate hain
  const { collections: allCollections } = useSelector(
    (state) => state.collections,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [brand, setBrand] = useState("");
  // Visibility alag cheez hai — stock 0 hona "hidden" nahi hota
  const [isHidden, setIsHidden] = useState(false);
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  // Multi-select — ek product Men + Women dono ke liye ho sakta hai
  const [subCategories, setSubCategories] = useState(["Men"]);
  // 🆕 Collections — Collections section (categories) se dynamic multi-select
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  // 🆕 Color variants — { name, images (retained URLs), newFiles: [{file, preview, id}] }
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const totalImageCount = existingImages.length + newImages.length;

  const selectedCategory = categories.find((c) => c._id === categoryId);
  // Sirf Men / Women — ab multi-select (ek product dono ke liye ho sakta hai)
  const availableSubCategories = selectedCategory?.subCategories?.length
    ? [...new Set(selectedCategory.subCategories)]
    : ["Men", "Women"];

  // 🆕 Collections section ke active collections — product form me dynamically
  // yahi dikhenge (koi hardcoded options nahi).
  const activeCollections = allCollections.filter((c) => c.isActive !== false);

  const toggleCollection = (collectionId) =>
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId],
    );

  // Sub-category multi-select toggle - Men + Women dono select ho sakte hain
  const toggleSubCategory = (value) =>
    setSubCategories((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );

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
        setDiscountPrice(
          editData.discountPrice != null ? String(editData.discountPrice) : "",
        );
        setBrand(editData.brand || "");
        setIsHidden(editData.isActive === false);
        setStock(editData.stock || "");
        setCategoryId(editData.categoryId?._id || editData.categoryId || "");
        // Purane products ki subCategory string ho sakti hai - array me
        // normalize karo; invalid values (jaise 'Unisex') filter ho jayengi
        const seededSubs = Array.isArray(editData.subCategory)
          ? editData.subCategory.filter((s) => ["Men", "Women"].includes(s))
          : ["Men", "Women"].includes(editData.subCategory)
            ? [editData.subCategory]
            : [];
        setSubCategories(seededSubs.length ? seededSubs : ["Men"]);
        setSelectedCollections(toCollectionIds(editData.collections));
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
        setDiscountPrice("");
        setBrand("");
        setIsHidden(false);
        setStock("");
        setCategoryId(categories.length > 0 ? categories[0]._id : "");
        setSubCategories(["Men"]);
        setSelectedCollections([]);
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
    const dp =
      "discountPrice" in fields ? fields.discountPrice : discountPrice;
    const s = "stock" in fields ? fields.stock : stock;
    const cat = "categoryId" in fields ? fields.categoryId : categoryId;

    if (!n.trim()) errs.name = "Product name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";

    if (!cat) errs.categoryId = "Please select a category.";

    // Sub-category - kam se kam ek select karna zaroori
    if (subCategories.length === 0)
      errs.subCategory = "Select at least one sub-category (Men or Women).";

    if (p === "" || p === null || p === undefined)
      errs.price = "Price is required.";
    else if (Number(p) < 0) errs.price = "Price cannot be negative.";

    if (s === "" || s === null || s === undefined)
      errs.stock = "Stock is required.";
    else if (Number(s) < 0) errs.stock = "Stock cannot be negative.";

    // Sale price ka rule — regular price se kam hona chahiye
    if (dp !== "" && dp !== null && dp !== undefined && Number(dp) > 0) {
      if (Number(dp) >= Number(p))
        errs.discountPrice = "Sale price must be less than the regular price.";
    }

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

  /**
   * Category dropdown options with hierarchy paths (e.g. "Bags › Laptop
   * Bags"), sorted alphabetically — same treatment as the category form.
   */
  const categoryOptions = (() => {
    const namesById = new Map(categories.map((c) => [String(c._id), c.name]));
    return categories
      .map((c) => {
        const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
        const parentName = pid ? namesById.get(pid) : null;
        return {
          id: String(c._id),
          label: parentName ? `${parentName} › ${c.name}` : c.name,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      description: true,
      price: true,
      discountPrice: true,
      stock: true,
      categoryId: true,
      subCategory: true,
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
    // Sale price — khali ho to null bhejo (existing sale remove ho jayegi)
    formData.append(
      "discountPrice",
      discountPrice !== "" && Number(discountPrice) > 0
        ? Number(discountPrice)
        : "",
    );
    formData.append("brand", brand);
    formData.append("stock", Number(stock));
    formData.append("categoryId", categoryId);
    formData.append("subCategory", JSON.stringify(subCategories));
    // Visibility aur stock alag concepts hain
    formData.append("isActive", !isHidden);
    // 🆕 Collections — Collections section se chune gaye ids (JSON array)
    formData.append("collections", JSON.stringify(selectedCollections));

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
          hint={
            err("description")
              ? undefined
              : description.trim()
                ? `${description.length} / 5000 characters`
                : "Materials, fit and features shoppers read before buying."
          }
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
                // Naye category ke allowed options ke hisaab se selection filter
                const filteredSubs = subCategories.filter((s) =>
                  allowed.includes(s),
                );
                if (filteredSubs.length === 0) {
                  setSubCategories(allowed.slice(0, 1));
                } else if (filteredSubs.length !== subCategories.length) {
                  setSubCategories(filteredSubs);
                }
                revalidate("categoryId", e.target.value);
              }}
              onBlur={() => handleBlur("categoryId", categoryId)}
              className={`form-select ${invalid("categoryId")}`}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Sub-category"
            required
            hint="Pick every audience that applies — options come from the selected category."
            error={touched.subCategory ? errors.subCategory : undefined}
          >
            <div className="flex flex-wrap gap-2">
              {availableSubCategories.map((opt) => {
                const checked = subCategories.includes(opt);
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      checked
                        ? "border-amber-500 bg-amber-50 font-semibold text-amber-700"
                        : "border-(--border) bg-(--surface-sunken) text-zinc-600 hover:border-amber-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubCategory(opt)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </Field>
        </div>

        {/* 🆕 Collections — options Collections section se dynamically aate hain */}
        <div className="form-row">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Collections
            </span>
            {activeCollections.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeCollections.map((col) => {
                  const checked = selectedCollections.includes(col._id);
                  return (
                    <label
                      key={col._id}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        checked
                          ? "border-amber-500 bg-amber-50 font-semibold text-amber-700"
                          : "border-(--border) bg-(--surface-sunken) text-zinc-600 hover:border-amber-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCollection(col._id)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      {col.name}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-(--radius) border border-dashed border-(--border) bg-(--surface-sunken) px-3 py-2.5 text-xs text-zinc-500">
                No collections yet — create one in the Collections section and
                it will appear here automatically.
              </p>
            )}
            <p className="mt-1.5 text-xs text-zinc-500">
              These options come from your Collections section — a product can
              belong to multiple collections. They power the &quot;Collections&quot;
              filter on the shop page.
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

        <div className="form-row">
          <Field
            label="Sale price (₹)"
            optional
            htmlFor="prod-discount"
            error={err("discountPrice")}
            hint={
              err("discountPrice")
                ? undefined
                : "Must be lower than the regular price. Leave empty for no sale."
            }
          >
            <input
              id="prod-discount"
              type="number"
              min="0"
              value={discountPrice}
              onChange={(e) => {
                setDiscountPrice(e.target.value);
                revalidate("discountPrice", e.target.value);
              }}
              onBlur={() => handleBlur("discountPrice", discountPrice)}
              placeholder="999"
              className={`form-input ${invalid("discountPrice")}`}
            />
          </Field>

          <Field label="Brand" optional htmlFor="prod-brand">
            <input
              id="prod-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Urban Gear"
              className="form-input"
            />
          </Field>
        </div>

        <Field
          label="Visibility"
          htmlFor="prod-status"
          hint="Hidden products stay in your catalog but disappear from the storefront. This is separate from stock — a product with 0 stock shows an Out of stock badge instead."
        >
          <select
            id="prod-status"
            value={isHidden ? "hidden" : "live"}
            onChange={(e) => setIsHidden(e.target.value === "hidden")}
            className="form-select"
          >
            <option value="live">Live on storefront</option>
            <option value="hidden">Hidden</option>
          </select>
        </Field>

        {/* 🆕 Color variants — niyabags live site jaisa */}
        <Field
          label="Color variants"
          optional
          error={err("variants")}
          hint="e.g. Black, Brown — each variant can have its own images. Price and stock are managed at the product level."
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

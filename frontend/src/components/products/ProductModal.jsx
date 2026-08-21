import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addProduct,
  updateProduct,
} from "../../features/products/productsSlice";
import { getAssetUrl } from "../../utils/assetUrl";

const MAX_IMAGES = 5;

const ProductModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("In Stock");
  const [categoryId, setCategoryId] = useState("");
  const [subCategory, setSubCategory] = useState("Unisex");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const totalImageCount = existingImages.length + newImages.length;

  const selectedCategory = categories.find((c) => c._id === categoryId);
  const availableSubCategories = selectedCategory?.subCategories?.length
    ? [...selectedCategory.subCategories, "Unisex"]
    : ["Men", "Women", "Unisex"];

  useEffect(() => {
    if (editData) {
      setName(editData.name || editData.title || "");
      setDescription(editData.description || "");
      setPrice(editData.price || "");
      setStock(editData.stock || "");
      setStatus(editData.isActive !== false ? "In Stock" : "Out of Stock");
      setCategoryId(editData.categoryId?._id || editData.categoryId || "");
      setSubCategory(editData.subCategory || "Unisex");
      setExistingImages(editData.images?.desktop || []);
      setNewImages([]);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setStatus("In Stock");
      setCategoryId(categories.length > 0 ? categories[0]._id : "");
      setSubCategory("Unisex");
      setExistingImages([]);
      setNewImages([]);
    }
    setErrors({});
    setTouched({});
  }, [editData, isOpen, categories]);

  useEffect(() => {
    if (!isOpen) {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    }
  }, [isOpen]);

  const getImageError = (existing = existingImages, newImgs = newImages) => {
    const count = existing.length + newImgs.length;
    if (count === 0) return "Please add at least one product image.";
    if (count > MAX_IMAGES) return `You can upload up to ${MAX_IMAGES} images only.`;
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
    else if (n.trim().length < 2) errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";

    if (!cat) errs.categoryId = "Please select a category.";

    if (p === "" || p === null || p === undefined) errs.price = "Price is required.";
    else if (Number(p) < 0) errs.price = "Price cannot be negative.";

    if (s === "" || s === null || s === undefined) errs.stock = "Stock is required.";
    else if (Number(s) < 0) errs.stock = "Stock cannot be negative.";

    const imageErr = getImageError();
    if (imageErr) errs.images = imageErr;

    return errs;
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = {
      name: true,
      description: true,
      price: true,
      stock: true,
      categoryId: true,
      images: true,
    };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "No description provided");
    formData.append("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    formData.append("price", Number(price));
    formData.append("stock", Number(stock));
    formData.append("categoryId", categoryId);
    formData.append("subCategory", subCategory);
    formData.append("isActive", status !== "Out of Stock");

    if (!editData) {
      formData.append("sku", `SKU-${Date.now()}`);
    }

    newImages.forEach((img) => formData.append("desktopImages", img.file));

    if (editData) {
      formData.append("retainedDesktopImages", JSON.stringify(existingImages));
    }

    if (editData) {
      dispatch(updateProduct({ id: editData._id, data: formData })).then((res) => {
        if (!res.error) onClose();
      });
    } else {
      dispatch(addProduct(formData)).then((res) => {
        if (!res.error) onClose();
      });
    }
  };

  const fieldClass = (field) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
      errors[field] && touched[field]
        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
        : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    }`;

  const ErrorMsg = ({ field }) =>
    errors[field] && touched[field] ? (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  const getImageUrl = (path) => getAssetUrl(path);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(15,23,42,0.18)" }}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {editData ? "Edit Product" : "Add New Product"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {editData ? "Update product details below." : "Fill in the details to add a new product."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    const errs = validate({ name: e.target.value });
                    setErrors((prev) => ({ ...prev, name: errs.name }));
                  }
                }}
                onBlur={() => handleBlur("name", name)}
                className={fieldClass("name")}
                placeholder="e.g., Urban Tech Backpack"
              />
              <ErrorMsg field="name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (touched.description) {
                    const errs = validate({ description: e.target.value });
                    setErrors((prev) => ({ ...prev, description: errs.description }));
                  }
                }}
                onBlur={() => handleBlur("description", description)}
                className={`${fieldClass("description")} resize-none`}
                placeholder="Brief description of the product..."
              />
              <ErrorMsg field="description" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const cat = categories.find((c) => c._id === e.target.value);
                  const allowed = cat?.subCategories?.length
                    ? [...cat.subCategories, "Unisex"]
                    : ["Men", "Women", "Unisex"];
                  if (!allowed.includes(subCategory)) {
                    setSubCategory(allowed[0] || "Unisex");
                  }
                  if (touched.categoryId) {
                    const errs = validate({ categoryId: e.target.value });
                    setErrors((prev) => ({ ...prev, categoryId: errs.categoryId }));
                  }
                }}
                onBlur={() => handleBlur("categoryId", categoryId)}
                className={`${fieldClass("categoryId")} bg-white`}
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <ErrorMsg field="categoryId" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
              >
                {availableSubCategories.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (touched.price) {
                      const errs = validate({ price: e.target.value });
                      setErrors((prev) => ({ ...prev, price: errs.price }));
                    }
                  }}
                  onBlur={() => handleBlur("price", price)}
                  className={fieldClass("price")}
                  placeholder="1499"
                />
                <ErrorMsg field="price" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value);
                    if (touched.stock) {
                      const errs = validate({ stock: e.target.value });
                      setErrors((prev) => ({ ...prev, stock: errs.stock }));
                    }
                  }}
                  onBlur={() => handleBlur("stock", stock)}
                  className={fieldClass("stock")}
                  placeholder="25"
                />
                <ErrorMsg field="stock" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {/* Multiple Images Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Product Images <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">
                  {totalImageCount}/{MAX_IMAGES} images
                </span>
              </div>

              {/* Image Previews */}
              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {existingImages.map((url) => (
                    <div
                      key={url}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={getImageUrl(url)}
                        alt="Existing product"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Remove image"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {newImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-indigo-200 bg-indigo-50"
                    >
                      <img
                        src={img.preview}
                        alt="New upload preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Remove image"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              {totalImageCount < MAX_IMAGES && (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    errors.images && touched.images
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, images: true }));
                      const imageErr = getImageError();
                      setErrors((prev) => ({ ...prev, images: imageErr }));
                    }}
                    className="hidden"
                  />
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PNG, JPG, WEBP — up to {MAX_IMAGES - totalImageCount} more
                  </p>
                </div>
              )}
              <ErrorMsg field="images" />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? "Saving..." : editData ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductModal;

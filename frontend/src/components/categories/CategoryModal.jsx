import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCategory,
  updateCategory,
} from "../../features/categories/categoriesSlice";

const CategoryModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.categories);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [subCategories, setSubCategories] = useState(["Men", "Women"]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description);
      setImage(null);
      setSubCategories(
        editData.subCategories?.length
          ? editData.subCategories
          : ["Men", "Women"],
      );
    } else {
      setName("");
      setDescription("");
      setImage(null);
      setSubCategories(["Men", "Women"]);
    }
    setErrors({});
    setTouched({});
  }, [editData, isOpen]);

  const toggleSubCategory = (value) => {
    setSubCategories((prev) => {
      const next = prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value];
      if (touched.subCategories) {
        const errs = validate({ subCategories: next });
        setErrors((prevErrs) => ({ ...prevErrs, subCategories: errs.subCategories }));
      }
      return next;
    });
  };

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const d = "description" in fields ? fields.description : description;
    const img = "image" in fields ? fields.image : image;
    const subs = "subCategories" in fields ? fields.subCategories : subCategories;

    if (!n.trim()) errs.name = "Category name is required.";
    else if (n.trim().length < 2) errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";
    else if (d.trim().length < 5) errs.description = "Description must be at least 5 characters.";

    if (!subs.length) errs.subCategories = "Select at least one sub-category (Men or Women).";

    if (!editData && !img) errs.image = "Please select a category image.";

    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value =
      field === "name"
        ? name
        : field === "description"
          ? description
          : field === "subCategories"
            ? subCategories
            : image;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = { name: true, description: true, image: true, subCategories: true };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    formData.append("description", description);
    formData.append("subCategories", JSON.stringify(subCategories));
    if (image) formData.append("image", image);

    if (editData) {
      dispatch(updateCategory({ id: editData._id, data: formData })).then((res) => {
        if (!res.error) onClose();
      });
    } else {
      dispatch(addCategory(formData)).then((res) => {
        if (!res.error) onClose();
      });
    }
  };

  return (
    <>
      {/* Backdrop — subtle, not black */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(15,23,42,0.18)" }}
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {editData ? "Edit Category" : "Add New Category"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {editData ? "Update category details below." : "Fill in the details to create a category."}
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

        {/* API Error */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category Name <span className="text-red-500">*</span>
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
                onBlur={() => handleBlur("name")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                  errors.name && touched.name
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                    : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                placeholder="e.g., Laptop Backpacks"
              />
              {errors.name && touched.name && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
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
                onBlur={() => handleBlur("description")}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none resize-none transition-colors ${
                  errors.description && touched.description
                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
                    : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                placeholder="Short description of the category..."
              />
              {errors.description && touched.description && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Sub Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sub Categories <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Choose which audiences this category covers.
              </p>
              <div className="flex gap-3">
                {["Men", "Women"].map((option) => {
                  const selected = subCategories.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleSubCategory(option)}
                      onBlur={() => handleBlur("subCategories")}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        selected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {errors.subCategories && touched.subCategories && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.subCategories}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category Image{" "}
                {editData ? (
                  <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>
                ) : (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  errors.image && touched.image
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setImage(e.target.files[0]);
                    if (touched.image) {
                      const errs = validate({ image: e.target.files[0] });
                      setErrors((prev) => ({ ...prev, image: errs.image }));
                    }
                  }}
                  onBlur={() => handleBlur("image")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {image ? (
                  <div className="flex items-center justify-center gap-2 text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium truncate max-w-xs">{image.name}</span>
                  </div>
                ) : (
                  <div>
                    <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload an image</p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
              </div>
              {errors.image && touched.image && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.image}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
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
            {loading ? "Saving..." : editData ? "Update Category" : "Add Category"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CategoryModal;

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addBanner,
  updateBanner,
} from "../../features/banners/bannersSlice";

const BannerModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.banners);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setSubtitle(editData.subtitle || "");
      setLinkUrl(editData.linkUrl || "");
      setSortOrder(editData.sortOrder || 0);
      setIsActive(editData.isActive !== false);
      setImage(null);
    } else {
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
      setSortOrder(0);
      setIsActive(true);
      setImage(null);
    }
    setErrors({});
    setTouched({});
  }, [editData, isOpen]);

  const validate = (fields = {}) => {
    const errs = {};
    const t = "title" in fields ? fields.title : title;
    const img = "image" in fields ? fields.image : image;
    const so = "sortOrder" in fields ? fields.sortOrder : sortOrder;

    if (!t.trim()) errs.title = "Banner title is required.";
    else if (t.trim().length < 2) errs.title = "Title must be at least 2 characters.";

    if (!editData && !img) errs.image = "Please select a banner image.";

    if (so < 0) errs.sortOrder = "Sort order cannot be negative.";

    return errs;
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = { title: true, image: true, sortOrder: true };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("linkUrl", linkUrl);
    formData.append("sortOrder", sortOrder);
    formData.append("isActive", isActive);
    if (image) formData.append("image", image);

    if (editData) {
      dispatch(updateBanner({ id: editData._id, data: formData })).then((res) => {
        if (!res.error) onClose();
      });
    } else {
      dispatch(addBanner(formData)).then((res) => {
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
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <>
      {/* Backdrop */}
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
              {editData ? "Edit Banner" : "Add New Banner"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {editData ? "Update banner details below." : "Fill in the details to create a banner."}
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
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Banner Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (touched.title) {
                    const errs = validate({ title: e.target.value });
                    setErrors((prev) => ({ ...prev, title: errs.title }));
                  }
                }}
                onBlur={() => handleBlur("title", title)}
                className={fieldClass("title")}
                placeholder="e.g., Summer Sale 2025"
              />
              <ErrorMsg field="title" />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subtitle <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., Up to 50% off on all bags"
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link URL <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., /products?category=summer"
              />
            </div>

            {/* Sort Order & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(Number(e.target.value));
                    if (touched.sortOrder) {
                      const errs = validate({ sortOrder: Number(e.target.value) });
                      setErrors((prev) => ({ ...prev, sortOrder: errs.sortOrder }));
                    }
                  }}
                  onBlur={() => handleBlur("sortOrder", sortOrder)}
                  className={fieldClass("sortOrder")}
                />
                <ErrorMsg field="sortOrder" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Banner Image{" "}
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
                  onBlur={() => handleBlur("image", image)}
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
              <ErrorMsg field="image" />
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
            {loading ? "Saving..." : editData ? "Update Banner" : "Add Banner"}
          </button>
        </div>
      </div>
    </>
  );
};

export default BannerModal;

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addProduct,
  updateProduct,
} from "../../features/products/productsSlice";

const ProductModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("In Stock");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (editData) {
      setName(editData.name || editData.title || "");
      setDescription(editData.description || "");
      setPrice(editData.price || "");
      setStock(editData.stock || "");
      setStatus(editData.isActive !== false ? "In Stock" : "Out of Stock");
      setCategoryId(editData.categoryId?._id || editData.categoryId || "");
      setImage(null);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setStatus("In Stock");
      setCategoryId(categories.length > 0 ? categories[0]._id : "");
      setImage(null);
    }
  }, [editData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "No description provided");
    formData.append("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    formData.append("price", Number(price));
    formData.append("stock", Number(stock));
    formData.append("categoryId", categoryId);
    formData.append("isActive", status !== "Out of Stock");

    // SKU sirf naye product ke liye generate karo, edit mein mat bhejo
    if (!editData) {
      formData.append("sku", `SKU-${Date.now()}`);
    }

    if (image) {
      formData.append("desktopImages", image);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {editData ? "Edit Product" : "Add New Product"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="e.g., Urban Tech Backpack"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="Description"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="1499"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
                  placeholder="25"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none bg-white"
              >
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image {editData && "(Leave blank to keep current)"}
              </label>
              <input
                type="file"
                accept="image/*"
                required={!editData}
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? "Saving..." : editData ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

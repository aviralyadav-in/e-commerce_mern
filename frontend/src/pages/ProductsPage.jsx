import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchProductsByCategory,
  setSelectedCategory,
} from "../features/products/productsSlice";
import { fetchCategories } from "../features/categories/categoriesSlice"; // Categories dropdown ke liye chahiye

// Components
import ProductTable from "../components/products/ProductTable";
import ProductModal from "../components/products/ProductModal";
import Loader from "../components/common/Loader";

const ProductsPage = () => {
  const dispatch = useDispatch();

  const { products, loading, error, selectedCategoryId } = useSelector(
    (state) => state.products,
  );
  const { categories, loading: catLoading } = useSelector(
    (state) => state.categories,
  );

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    // Categories hamesha chahiye dropdown ke liye
    if (categories.length === 0) dispatch(fetchCategories());

    // Check karo konsi API call karni hai
    if (selectedCategoryId) {
      dispatch(fetchProductsByCategory(selectedCategoryId));
    } else {
      dispatch(fetchProducts());
    }
  }, [dispatch, selectedCategoryId]);

  // Handlers
  const handleCategoryFilter = (e) => {
    const catId = e.target.value;
    // Agar empty string aayi hai matlab "All Categories"
    dispatch(setSelectedCategory(catId === "" ? null : catId));
  };

  const handleOpenAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditData(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your inventory, prices, and stock status.
          </p>
        </div>

        {/* Controls: Filter Dropdown + Add Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Category Filter Dropdown */}
          <select
            value={selectedCategoryId || ""}
            onChange={handleCategoryFilter}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none bg-white text-gray-700 shadow-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      {loading || catLoading ? (
        <Loader />
      ) : (
        <ProductTable products={products} onEdit={handleOpenEdit} />
      )}

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={editData}
      />
    </div>
  );
};

export default ProductsPage;

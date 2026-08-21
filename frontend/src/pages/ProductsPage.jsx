import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchProductsByCategory,
  setSelectedCategory,
} from "../features/products/productsSlice";
import { fetchCategories } from "../features/categories/categoriesSlice";
import { exportAllProductsToExcel } from "../utils/exportProductToExcel";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());

    if (selectedCategoryId) {
      dispatch(fetchProductsByCategory(selectedCategoryId));
    } else {
      dispatch(fetchProducts());
    }
  }, [dispatch, selectedCategoryId]);

  const handleCategoryFilter = (e) => {
    const catId = e.target.value;
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

  const handleExportAll = () => {
    if (!products.length) {
      alert("No products available to export.");
      return;
    }
    const getCategoryName = (id) => {
      if (typeof id === "object" && id?.name) return id.name;
      const catId = typeof id === "object" ? id?._id : id;
      const cat = categories.find((c) => c._id === catId);
      return cat ? cat.name : "Unknown Category";
    };
    exportAllProductsToExcel(products, getCategoryName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your inventory, prices, and stock status.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
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

          <button
            onClick={handleExportAll}
            title="Download all products as Excel"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Excel
          </button>

          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

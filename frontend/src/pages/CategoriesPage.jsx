import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../features/categories/categoriesSlice";

// Components
import CategoryTable from "../components/categories/CategoryTable";
import CategoryModal from "../components/categories/CategoryModal";
import Loader from "../components/common/Loader";

const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { categories, loading, deleteLoading } = useSelector(
    (state) => state.categories,
  );

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null); // Agar null hai, matlab Add karna hai

  // Page mount par categories fetch karo
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Handlers
  const handleOpenAdd = () => {
    setEditData(null); // Data clear kiya naye form ke liye
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditData(category); // Purana data modal me bheja
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize your products by creating and managing categories.
          </p>
        </div>

        {/* Add New Button */}
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm shadow-indigo-200"
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
          Add Category
        </button>
      </div>

      {/* Delete Loading Indicator */}
      {deleteLoading && (
        <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl text-sm animate-pulse border border-yellow-200">
          Deleting category and its associated products... Please wait.
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <Loader />
      ) : (
        <CategoryTable categories={categories} onEdit={handleOpenEdit} />
      )}

      {/* Modal Component (Hidden by default) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />
    </div>
  );
};

export default CategoriesPage;

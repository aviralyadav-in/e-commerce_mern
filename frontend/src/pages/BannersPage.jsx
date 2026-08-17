import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners } from "../features/banners/bannersSlice";

// Components
import BannerTable from "../components/banners/BannerTable";
import BannerModal from "../components/banners/BannerModal";
import Loader from "../components/common/Loader";

const BannersPage = () => {
  const dispatch = useDispatch();
  const { banners, loading, error } = useSelector((state) => state.banners);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Page mount par banners fetch karo
  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  // Handlers
  const handleOpenAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditData(banner);
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
          <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store's hero banners and promotional images.
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
          Add Banner
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <Loader />
      ) : (
        <BannerTable banners={banners} onEdit={handleOpenEdit} />
      )}

      {/* Modal Component */}
      <BannerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />
    </div>
  );
};

export default BannersPage;

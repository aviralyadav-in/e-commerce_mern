import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoupons } from "../features/coupons/couponsSlice";

// Components
import CouponTable from "../components/coupons/CouponTable";
import CouponModal from "../components/coupons/CouponModal";
import Loader from "../components/common/Loader";

const CouponsPage = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error } = useSelector((state) => state.coupons);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Page mount par coupons fetch karo
  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  // Handlers
  const handleOpenAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditData(coupon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  // Stats
  const activeCoupons = coupons.filter(
    (c) => c.isActive && new Date(c.expiryDate) >= new Date(),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage discount coupons for your customers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Active Coupons Badge */}
          <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm font-medium text-green-800">
              Active:
            </span>
            <span className="font-bold text-green-900">{activeCoupons}</span>
          </div>

          {/* Add New Button */}
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
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
            Add Coupon
          </button>
        </div>
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
        <CouponTable coupons={coupons} onEdit={handleOpenEdit} />
      )}

      {/* Modal Component */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />
    </div>
  );
};

export default CouponsPage;

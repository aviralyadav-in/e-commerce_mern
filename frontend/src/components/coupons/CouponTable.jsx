import React from "react";
import { useDispatch } from "react-redux";
import { deleteCoupon } from "../../features/coupons/couponsSlice";

const CouponTable = ({ coupons, onEdit }) => {
  const dispatch = useDispatch();

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      dispatch(deleteCoupon(id));
    }
  };

  // Check if coupon is expired
  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Discount</th>
              <th className="px-6 py-4 font-medium">Min Order</th>
              <th className="px-6 py-4 font-medium">Expiry Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <tr
                  key={coupon._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Coupon Code */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm tracking-wider border border-indigo-100">
                      {coupon.code}
                    </span>
                  </td>

                  {/* Discount */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 text-base">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : `₹${coupon.discountValue}`}
                    </span>
                    <span className="text-xs text-gray-400 block mt-0.5 capitalize">
                      {coupon.discountType}
                    </span>
                  </td>

                  {/* Min Order Value */}
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    ₹{(coupon.minOrderValue || 0).toLocaleString("en-IN")}
                  </td>

                  {/* Expiry Date */}
                  <td className="px-6 py-4">
                    <span
                      className={`font-medium ${
                        isExpired(coupon.expiryDate)
                          ? "text-red-500"
                          : "text-gray-600"
                      }`}
                    >
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </span>
                    {isExpired(coupon.expiryDate) && (
                      <span className="text-xs text-red-400 block mt-0.5">
                        Expired
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${
                          coupon.isActive && !isExpired(coupon.expiryDate)
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {coupon.isActive && !isExpired(coupon.expiryDate)
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(coupon)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No coupons found. Click 'Add Coupon' to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponTable;

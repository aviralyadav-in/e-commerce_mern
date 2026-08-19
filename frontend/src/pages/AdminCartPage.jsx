import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCarts } from "../features/adminCart/adminCartSlice";

// Components
import AdminCartTable from "../components/adminCart/AdminCartTable";
import Loader from "../components/common/Loader";

const AdminCartPage = () => {
  const dispatch = useDispatch();
  const { carts, totalEntries, loading, error } = useSelector(
    (state) => state.adminCart,
  );

  // Page load hone par carts fetch karo
  useEffect(() => {
    dispatch(fetchAllCarts());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Carts</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all products added to cart by customers on your store.
          </p>
        </div>

        {/* Total Entries Badge */}
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-lg flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-medium text-emerald-800">
            Total Entries:
          </span>
          <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md">
            {totalEntries}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Content Area */}
      {loading ? <Loader /> : <AdminCartTable carts={carts} />}
    </div>
  );
};

export default AdminCartPage;

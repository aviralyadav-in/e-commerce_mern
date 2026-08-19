import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllWishlists } from "../features/wishlist/wishlistSlice";

// Components
import WishlistTable from "../components/wishlist/WishlistTable";
import Loader from "../components/common/Loader";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { wishlists, totalEntries, loading, error } = useSelector(
    (state) => state.wishlist,
  );

  // Page load hone par wishlists fetch karo
  useEffect(() => {
    dispatch(fetchAllWishlists());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wishlists</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all products wishlisted by customers on your store.
          </p>
        </div>

        {/* Total Entries Badge */}
        <div className="bg-pink-50 border border-pink-100 px-4 py-2 rounded-lg flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-medium text-pink-800">
            Total Entries:
          </span>
          <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-md">
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
      {loading ? <Loader /> : <WishlistTable wishlists={wishlists} />}
    </div>
  );
};

export default WishlistPage;

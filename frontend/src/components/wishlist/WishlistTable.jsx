import React from "react";
import { getAssetUrl } from "../../utils/assetUrl";

const WishlistTable = ({ wishlists }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">#</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Added Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {wishlists.length > 0 ? (
              wishlists.map((item, index) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Serial Number */}
                  <td className="px-6 py-4 text-gray-400 font-medium">
                    {index + 1}
                  </td>

                  {/* Customer Info */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        {item.userName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.userEmail}
                      </span>
                    </div>
                  </td>

                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.productImage ? (
                        <img
                          src={getAssetUrl(item.productImage)}
                          alt={item.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium text-gray-800 max-w-[200px] truncate">
                        {item.productName}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {item.productDiscountPrice ? (
                        <>
                          <span className="font-bold text-green-600">
                            ₹{item.productDiscountPrice.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            ₹{item.productPrice.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-800">
                          ₹{item.productPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Added Date */}
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {item.addedAt
                      ? new Date(item.addedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium">
                      No wishlist entries found
                    </p>
                    <p className="text-xs text-gray-400">
                      When users add products to their wishlist, they will appear
                      here.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WishlistTable;

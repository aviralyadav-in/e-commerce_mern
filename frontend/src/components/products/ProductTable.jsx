import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct } from "../../features/products/productsSlice";

const ProductTable = ({ products, onEdit }) => {
  const dispatch = useDispatch();
  // Category ka naam dikhane ke liye store se categories lenge
  const { categories } = useSelector((state) => state.categories);

  const getCategoryName = (id) => {
    // Product me category object ho sakti hai (populated) ya sirf id
    const catId = typeof id === "object" ? id?._id : id;
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.name : "Unknown Category";
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Stock / Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {products.length > 0 ? (
              products.map((prod) => (
                <tr
                  key={prod._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Product Details (Image + Title) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={prod.images?.desktop?.[0] ? `http://localhost:5000${prod.images.desktop[0]}` : "https://via.placeholder.com/150"}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">
                          {prod.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ID: {prod._id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category Name */}
                  <td className="px-6 py-4 text-gray-600">
                    {getCategoryName(prod.categoryId)}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{prod.price?.toLocaleString("en-IN") || 0}
                  </td>

                  {/* Stock & Status */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-gray-600 font-medium">
                        Qty: {prod.stock || 0}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${
                          prod.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {prod.isActive ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(prod)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
                        onClick={() => handleDelete(prod._id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
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
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No products found. Add some!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;

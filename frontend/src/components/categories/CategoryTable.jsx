import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteCategory } from "../../features/categories/categoriesSlice";

const CategoryTable = ({ categories, onEdit }) => {
  const dispatch = useDispatch();
  const { deleteLoading } = useSelector((state) => state.categories);

  const handleDelete = (id) => {
    // Alert lagaya taaki galti se delete na ho jaye
    if (
      window.confirm(
        "Are you sure? This will delete all products inside this category too!",
      )
    ) {
      dispatch(deleteCategory(id));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Image</th>
              <th className="px-6 py-4 font-medium">Category Details</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                  {/* Image Column */}
                  <td className="px-6 py-4 w-24">
                    <img
                      src={cat.image ? `http://localhost:5000${cat.image}` : "https://via.placeholder.com/150"}
                      alt={cat.name}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
                    />
                  </td>

                  {/* Details Column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-base">
                        {cat.name}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        {cat.description}
                      </span>
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(cat)} // Edit button click par data bhejo
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
                        onClick={() => handleDelete(cat._id)}
                        disabled={deleteLoading}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
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
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  No categories found. Click 'Add Category' to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;

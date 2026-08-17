import React from "react";

const UserTable = ({ users }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">Gender</th>
              <th className="px-6 py-4 font-medium">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {users.length > 0 ? (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Name & ID Column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID: {user._id}
                      </span>
                    </div>
                  </td>

                  {/* Email & Phone Column */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 text-gray-600">
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
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
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span>{user.phone || "N/A"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Gender Column — FIX: Address field User model mein nahi hai, gender dikhao */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                        ${
                          user.gender === "male"
                            ? "bg-blue-50 text-blue-700"
                            : user.gender === "female"
                              ? "bg-pink-50 text-pink-700"
                              : user.gender === "other"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      {user.gender === "prefer_not_to_say"
                        ? "Not Specified"
                        : user.gender || "N/A"}
                    </span>
                  </td>

                  {/* Joined Date Column */}
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No users found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;

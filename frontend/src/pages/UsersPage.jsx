import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../features/users/usersSlice";

// Components
import UserTable from "../components/users/UserTable";
import Loader from "../components/common/Loader";

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);

  // Page load hone par users fetch karo
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all registered customers on your store.
          </p>
        </div>

        {/* Total Users Badge */}
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-medium text-indigo-800">
            Total Customers:
          </span>
          <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md">
            {users.length}
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
      {loading ? <Loader /> : <UserTable users={users} />}
    </div>
  );
};

export default UsersPage;

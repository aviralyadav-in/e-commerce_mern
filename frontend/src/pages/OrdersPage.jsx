import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../features/orders/ordersSlice";
import { fetchUsers } from "../features/users/usersSlice"; // Customers ka naam dikhane ke liye chahiye

// Components
import OrderTable from "../components/orders/OrderTable";
import Loader from "../components/common/Loader";

const OrdersPage = () => {
  const dispatch = useDispatch();

  const { orders, loading, error } = useSelector((state) => state.orders);
  const { users } = useSelector((state) => state.users);

  useEffect(() => {
    // Agar users ka data nahi hai, toh use bhi fetch karo
    if (users.length === 0) {
      dispatch(fetchUsers());
    }
    // Hamesha latest orders fetch karo page load par
    dispatch(fetchOrders());
  }, [dispatch, users.length]);

  // Statistics calculate karna
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "Processing",
  ).length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer orders and update their delivery status.
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="bg-yellow-50 border border-yellow-100 px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-sm font-medium text-yellow-800">
              Pending:
            </span>
            <span className="font-bold text-yellow-900">{pendingOrders}</span>
          </div>

          <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-xl items-center gap-2 hidden sm:flex">
            <span className="text-sm font-medium text-green-800">Revenue:</span>
            <span className="font-bold text-green-900">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? <Loader /> : <OrderTable orders={orders} />}
    </div>
  );
};

export default OrdersPage;

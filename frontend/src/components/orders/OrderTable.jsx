import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateOrderStatus,
  deleteOrder,
} from "../../features/orders/ordersSlice";

const OrderTable = ({ orders }) => {
  const dispatch = useDispatch();

  // Redux store se users ka data liya taaki unka naam dikha sakein
  const { users } = useSelector((state) => state.users);

  const getCustomerName = (userId) => {
    // order.userId ho sakta hai object ho ya sirf string id
    const idStr = typeof userId === 'object' ? userId?._id : userId;
    const user = users.find((u) => u._id === idStr);
    return user ? user.name : userId?.name || "Unknown Customer";
  };

  // Status Update Handler
  const handleStatusChange = (orderId, newStatus) => {
    if (window.confirm(`Update order status to ${newStatus}?`)) {
      dispatch(updateOrderStatus({ id: orderId, orderStatus: newStatus }));
    }
  };

  // Delete Order Handler
  const handleDelete = (orderId) => {
    if (
      window.confirm("Are you sure you want to delete this order entirely?")
    ) {
      dispatch(deleteOrder(orderId));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Order ID & Date</th>
              <th className="px-6 py-4 font-medium">Customer Details</th>
              <th className="px-6 py-4 font-medium">Items & Total</th>
              <th className="px-6 py-4 font-medium">Status Update</th>
              <th className="px-6 py-4 font-medium text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Order ID & Date */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">
                        {order._id}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>

                  {/* Customer Details */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {getCustomerName(order.userId)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID: {typeof order.userId === 'object' ? order.userId?._id : order.userId}
                      </span>
                    </div>
                  </td>

                  {/* Items & Total */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-600 text-xs mb-1">
                        {order.items.length}{" "}
                        {order.items.length > 1 ? "items" : "item"}
                      </span>
                      <span className="font-bold text-gray-900 text-base">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-6 py-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 outline-none cursor-pointer transition-colors
                        ${
                          order.orderStatus === "Delivered"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : order.orderStatus === "Shipped"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-yellow-200 bg-yellow-50 text-yellow-700"
                        }
                      `}
                    >
                      <option
                        value="Processing"
                        className="text-gray-800 bg-white"
                      >
                        Processing
                      </option>
                      <option
                        value="Shipped"
                        className="text-gray-800 bg-white"
                      >
                        Shipped
                      </option>
                      <option
                        value="Delivered"
                        className="text-gray-800 bg-white"
                      >
                        Delivered
                      </option>
                    </select>
                  </td>

                  {/* Delete Button */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Order"
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;

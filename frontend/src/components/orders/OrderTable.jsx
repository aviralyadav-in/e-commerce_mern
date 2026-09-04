import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateOrderStatus } from "../../features/orders/ordersSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import {
  formatCurrency,
  formatDate,
  initials,
  shortId,
} from "../../utils/format";
import { ClipboardIcon, EyeIcon, XIcon } from "../common/Icon";
import { ORDER_STATUSES } from "../../utils/orderStatuses";

/** Sorting by status should follow the fulfilment pipeline, not the alphabet. */
const STATUS_RANK = ORDER_STATUSES.reduce(
  (acc, status, i) => ({ ...acc, [status]: i }),
  {},
);

const STATUS_SELECT = {
  Pending: "border-orange-200 bg-orange-50 text-orange-700",
  Processing: "border-amber-200 bg-amber-50 text-amber-700",
  Shipped: "border-blue-200 bg-blue-50 text-blue-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

const PAYMENT_BADGE = {
  Completed: "badge-success",
  Pending: "badge-warning",
  Failed: "badge-danger",
  Refunded: "badge-info",
};

// Admin payment confirm control — no gateway, toh manually mark hota hai
const PAYMENT_SELECT = {
  Pending: "border-orange-200 bg-orange-50 text-orange-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-red-200 bg-red-50 text-red-700",
  Refunded: "border-blue-200 bg-blue-50 text-blue-700",
};

const OrderTable = ({ orders, onView }) => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [cancelTarget, setCancelTarget] = useState(null);

  const getCustomerName = (user) => {
    if (typeof user === "object" && user?.name) return user.name;
    const idStr = typeof user === "object" ? user?._id : user;
    const found = users.find((u) => u._id === idStr);
    return found ? found.name : "Unknown";
  };

  const table = useTableControls(orders, {
    accessors: {
      order: (o) => (o.createdAt ? new Date(o.createdAt).getTime() : null),
      customer: (o) => getCustomerName(o.user),
      total: (o) => Number(o.totalAmount) || 0,
      payment: (o) => o.paymentMethod || "",
      status: (o) => STATUS_RANK[o.orderStatus] ?? 99,
    },
    initialSort: { key: "order", dir: "desc" },
    pageSize: 10,
  });

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    dispatch(
      updateOrderStatus({ id: cancelTarget._id, orderStatus: "Cancelled" }),
    );
    setCancelTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-240">
            <thead>
              <tr>
                <SortableTh
                  label="Order"
                  sortKey="order"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Customer"
                  sortKey="customer"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Total"
                  sortKey="total"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Payment"
                  sortKey="payment"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.length > 0 ? (
                table.rows.map((order) => {
                  const itemCount = order.orderItems?.length || 0;
                  const email =
                    typeof order.user === "object" ? order.user?.email : "";

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <button
                          onClick={() => onView(order._id)}
                          className="font-mono text-[12px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-left cursor-pointer"
                        >
                          {shortId(order._id)}
                        </button>
                        <span className="cell-sub text-slate-400 text-[11.5px]">
                          {formatDate(order.createdAt || order.orderDate)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-slate-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0 border border-indigo-100 shadow-xs">
                            {initials(getCustomerName(order.user))}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-45 text-[13px]">
                              {getCustomerName(order.user)}
                            </p>
                            <span className="cell-sub truncate max-w-45 text-slate-400 text-[11.5px]">
                              {email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <p className="cell-strong text-slate-900 font-bold text-[13.5px]">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <span className="cell-sub text-slate-400 text-[11px]">
                          {itemCount} item{itemCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="cell-strong text-slate-800 text-[12.5px]">
                          {order.paymentMethod || "Online"}
                        </p>
                        <select
                          value={order.paymentStatus || "Pending"}
                          onChange={(e) =>
                            dispatch(
                              updateOrderStatus({
                                id: order._id,
                                paymentStatus: e.target.value,
                              }),
                            )
                          }
                          aria-label={`Payment status for ${shortId(order._id)}`}
                          className={`mt-1 px-2 py-1 rounded-lg text-[11.5px] font-bold border outline-none cursor-pointer transition-all shadow-xs ${
                            PAYMENT_SELECT[order.paymentStatus] ||
                            "border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          {["Pending", "Completed", "Failed", "Refunded"].map(
                            (ps) => (
                              <option key={ps} value={ps}>
                                {ps}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td>
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            dispatch(
                              updateOrderStatus({
                                id: order._id,
                                orderStatus: e.target.value,
                              }),
                            )
                          }
                          aria-label={`Order status for ${shortId(order._id)}`}
                          className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border outline-none cursor-pointer transition-all shadow-xs ${
                            STATUS_SELECT[order.orderStatus] ||
                            "border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onView(order._id)}
                            className="icon-btn icon-btn-view"
                            title="View order details"
                            aria-label={`View ${shortId(order._id)}`}
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          {order.orderStatus !== "Cancelled" &&
                            order.orderStatus !== "Delivered" && (
                              <button
                                onClick={() => setCancelTarget(order)}
                                className="icon-btn icon-btn-delete"
                                title="Cancel order"
                                aria-label={`Cancel ${shortId(order._id)}`}
                              >
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    <EmptyState
                      icon={<ClipboardIcon className="w-5 h-5" />}
                      title="No orders found"
                      message="Orders placed on the storefront land here. Try clearing the status filter or search."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={table.page}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          total={table.total}
          rangeStart={table.rangeStart}
          rangeEnd={table.rangeEnd}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
          noun="orders"
        />
      </div>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel order?"
        message={
          cancelTarget
            ? `Order ${shortId(cancelTarget._id)} will be marked Cancelled. Product stock goes back to inventory and the record stays in history for audit/refund.`
            : ""
        }
        confirmLabel="Cancel order"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
};

export default OrderTable;

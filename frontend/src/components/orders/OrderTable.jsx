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
import { CheckIcon, ClipboardIcon, EyeIcon, XIcon } from "../common/Icon";
import { ORDER_STATUSES } from "../../utils/orderStatuses";
import { notifySuccess, notifyError } from "../../lib/toast";

/** Sorting by status should follow the fulfilment pipeline, not the alphabet. */
const STATUS_RANK = ORDER_STATUSES.reduce(
  (acc, status, i) => ({ ...acc, [status]: i }),
  {},
);

const STATUS_SELECT = {
  Pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-300",
  Processing:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-700/50 dark:text-indigo-300",
  Shipped:
    "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700/50 dark:text-blue-300",
  Delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700/50 dark:text-emerald-300",
  Cancelled:
    "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-700/50 dark:text-rose-300",
};

// Admin payment confirm control — manual marking for online/COD receipts
const PAYMENT_SELECT = {
  Pending:
    "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-300",
  Completed:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700/50 dark:text-emerald-300",
  Failed:
    "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-700/50 dark:text-rose-300",
  Refunded:
    "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700/50 dark:text-blue-300",
};

const OrderTable = ({ orders, onView }) => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    notifySuccess("Order ID copied to clipboard", id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(
        updateOrderStatus({ id: orderId, orderStatus: newStatus }),
      ).unwrap();
    } catch (err) {
      notifyError("Failed to update status", err || "Something went wrong");
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await dispatch(
        updateOrderStatus({ id: orderId, paymentStatus: newPaymentStatus }),
      ).unwrap();
    } catch (err) {
      notifyError("Failed to update payment", err || "Something went wrong");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await dispatch(
        updateOrderStatus({ id: cancelTarget._id, orderStatus: "Cancelled" }),
      ).unwrap();
      notifySuccess(
        "Order cancelled",
        `Order ${shortId(cancelTarget._id)} has been cancelled. Inventory restored.`,
      );
    } catch (err) {
      notifyError("Failed to cancel order", err || "Something went wrong");
    }
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
                  label="Fulfilment Status"
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
                    <tr
                      key={order._id}
                      className="hover:bg-(--surface-sunken)/70 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onView(order._id)}
                            className="font-mono text-[12.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline text-left cursor-pointer"
                            title="View full order details"
                          >
                            {shortId(order._id)}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, order._id)}
                            className="p-1 rounded text-(--ink-faint) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
                            title={
                              copiedId === order._id
                                ? "Copied!"
                                : "Copy full Order ID"
                            }
                            aria-label="Copy full Order ID"
                          >
                            {copiedId === order._id ? (
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <ClipboardIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="cell-sub text-(--ink-faint) text-[11.5px] block mt-0.5">
                          {formatDate(order.createdAt || order.orderDate)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-xs">
                            {initials(getCustomerName(order.user))}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-45 text-[13px] text-(--ink)">
                              {getCustomerName(order.user)}
                            </p>
                            <span className="cell-sub truncate max-w-45 text-(--ink-muted) text-[11.5px] block">
                              {email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <p className="cell-strong text-(--ink) font-bold text-[13.5px] tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <span className="cell-sub text-(--ink-muted) text-[11px] block">
                          {itemCount} item{itemCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="cell-strong text-(--ink) font-semibold text-[12px]">
                          {order.paymentMethod || "Online"}
                        </p>
                        <select
                          value={order.paymentStatus || "Pending"}
                          onChange={(e) =>
                            handlePaymentStatusChange(order._id, e.target.value)
                          }
                          aria-label={`Payment status for ${shortId(order._id)}`}
                          className={`mt-1 px-2.5 py-1 rounded-lg text-[11.5px] font-bold border outline-none cursor-pointer transition-all shadow-xs ${
                            PAYMENT_SELECT[order.paymentStatus] ||
                            "border-(--border) bg-(--surface-card) text-(--ink)"
                          }`}
                        >
                          {["Pending", "Completed", "Failed", "Refunded"].map(
                            (ps) => (
                              <option
                                key={ps}
                                value={ps}
                                className="bg-(--surface-card) text-(--ink)"
                              >
                                {ps}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                      <td>
                        <select
                          value={order.orderStatus}
                          disabled={
                            order.orderStatus === "Delivered" ||
                            order.orderStatus === "Cancelled"
                          }
                          title={
                            order.orderStatus === "Delivered"
                              ? "Delivered orders cannot be modified"
                              : order.orderStatus === "Cancelled"
                                ? "Cancelled orders cannot be modified"
                                : `Change fulfilment status for ${shortId(order._id)}`
                          }
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          aria-label={`Order status for ${shortId(order._id)}`}
                          className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border outline-none transition-all shadow-xs ${
                            order.orderStatus === "Delivered" ||
                            order.orderStatus === "Cancelled"
                              ? "opacity-80 cursor-not-allowed "
                              : "cursor-pointer "
                          }${
                            STATUS_SELECT[order.orderStatus] ||
                            "border-(--border) bg-(--surface-card) text-(--ink)"
                          }`}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="bg-(--surface-card) text-(--ink)"
                            >
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
                            title="View order details & shipping address"
                            aria-label={`View ${shortId(order._id)}`}
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          {order.orderStatus !== "Cancelled" &&
                            order.orderStatus !== "Delivered" && (
                              <button
                                onClick={() => setCancelTarget(order)}
                                className="icon-btn icon-btn-delete"
                                title="Cancel order (returns stock)"
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
            ? `Order ${shortId(cancelTarget._id)} will be marked Cancelled. Product stock will be automatically returned to inventory and the record stays preserved for audit.`
            : ""
        }
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
};

export default OrderTable;

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateOrderStatus,
  deleteOrder,
} from "../../features/orders/ordersSlice";
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
import { ClipboardIcon, EyeIcon, TrashIcon } from "../common/Icon";

export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

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

const OrderTable = ({ orders, onView }) => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteOrder(deleteTarget._id));
    setDeleteTarget(null);
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
                    <tr key={order._id}>
                      <td>
                        <p className="font-mono text-[12px] font-semibold text-(--ink)">
                          {shortId(order._id)}
                        </p>
                        <span className="cell-sub">
                          {formatDate(order.createdAt || order.orderDate)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="avatar w-7 h-7 text-[10.5px]">
                            {initials(getCustomerName(order.user))}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-42.5">
                              {getCustomerName(order.user)}
                            </p>
                            <span className="cell-sub truncate max-w-42.5">
                              {email || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <p className="cell-strong">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <span className="cell-sub">
                          {itemCount} item{itemCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="cell-strong">
                          {order.paymentMethod || "—"}
                        </p>
                        <span
                          className={`badge ${
                            PAYMENT_BADGE[order.paymentStatus] ||
                            "badge-neutral"
                          }`}
                        >
                          {order.paymentStatus || "Unknown"}
                        </span>
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
                          className={`px-2 py-1 rounded-md text-[12px] font-semibold border outline-none cursor-pointer transition-colors ${
                            STATUS_SELECT[order.orderStatus] ||
                            "border-(--border) bg-white text-(--ink)"
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
                          <button
                            onClick={() => setDeleteTarget(order)}
                            className="icon-btn icon-btn-delete"
                            title="Delete order"
                            aria-label={`Delete ${shortId(order._id)}`}
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
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
        isOpen={!!deleteTarget}
        title="Delete order?"
        message={
          deleteTarget
            ? `Order ${shortId(deleteTarget._id)} will be permanently deleted. Consider marking it Cancelled instead if you need the record.`
            : ""
        }
        confirmLabel="Delete order"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default OrderTable;

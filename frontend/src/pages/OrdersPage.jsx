import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../features/orders/ordersSlice";
import { fetchUsers } from "../features/users/usersSlice";
import { exportAllOrdersToExcel } from "../utils/exportProductToExcel";
import { toastInfo } from "../features/ui/uiSlice";

import PageHeader from "../components/common/PageHeader";
import OrderTable, { ORDER_STATUSES } from "../components/orders/OrderTable";
import OrderDetailModal from "../components/orders/OrderDetailModal";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { formatCurrency } from "../utils/format";
import { DownloadIcon, RefreshIcon } from "../components/common/Icon";

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { users } = useSelector((state) => state.users);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [viewOrderId, setViewOrderId] = useState(null);

  useEffect(() => {
    if (users.length === 0) dispatch(fetchUsers());
    dispatch(fetchOrders());
  }, [dispatch, users.length]);

  const getCustomerName = (user) => {
    if (typeof user === "object" && user?.name) return user.name;
    const idStr = typeof user === "object" ? user?._id : user;
    const found = users.find((u) => u._id === idStr);
    return found ? found.name : "Unknown";
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    ORDER_STATUSES.forEach((s) => (counts[s] = 0));
    orders.forEach((o) => {
      if (counts[o.orderStatus] != null) counts[o.orderStatus] += 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (status && order.orderStatus !== status) return false;
      if (!q) return true;
      const email =
        typeof order.user === "object"
          ? String(order.user?.email || "").toLowerCase()
          : "";
      return (
        String(order._id || "").toLowerCase().includes(q) ||
        getCustomerName(order.user).toLowerCase().includes(q) ||
        email.includes(q) ||
        String(order.orderStatus || "").toLowerCase().includes(q) ||
        String(order.couponCode || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, status, users]);

  const openCount = statusCounts.Pending + statusCounts.Processing;

  /** Cancelled orders never became money, so they stay out of revenue. */
  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.orderStatus !== "Cancelled")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [orders],
  );

  const handleExport = () => {
    if (!orders.length) {
      dispatch(toastInfo("Nothing to export", "No orders have been placed yet."));
      return;
    }
    exportAllOrdersToExcel(orders, getCustomerName);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Orders"
        subtitle="Track fulfilment and update order status as parcels move."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>{formatCurrency(revenue, { compact: true })}</b> revenue
            </span>
            <span className="meta-chip">
              <b>{orders.length}</b> orders
            </span>
            <span
              className={`meta-chip ${
                openCount > 0 ? "meta-chip-warning" : ""
              }`}
            >
              <b>{openCount}</b> awaiting action
            </span>
            {statusCounts.Delivered > 0 && (
              <span className="meta-chip meta-chip-info">
                <b>{statusCounts.Delivered}</b> delivered
              </span>
            )}
          </>
        }
        actions={
          <>
            <button
              onClick={() => dispatch(fetchOrders())}
              className="btn btn-secondary"
              title="Refresh orders"
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={handleExport} className="btn btn-export">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
          </>
        }
      />

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search order id, customer, coupon…"
        />
        <SegmentedFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: orders.length },
            ...ORDER_STATUSES.map((s) => ({
              value: s,
              label: s,
              count: statusCounts[s],
            })),
          ]}
        />
      </div>

      <ErrorBanner message={error} onRetry={() => dispatch(fetchOrders())} />

      {loading && orders.length === 0 ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <OrderTable orders={filteredOrders} onView={(id) => setViewOrderId(id)} />
      )}

      <OrderDetailModal
        isOpen={!!viewOrderId}
        orderId={viewOrderId}
        onClose={() => setViewOrderId(null)}
      />
    </div>
  );
};

export default OrdersPage;

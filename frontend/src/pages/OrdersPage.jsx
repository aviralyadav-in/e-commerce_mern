import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../features/orders/ordersSlice";
import { fetchUsers } from "../features/users/usersSlice";
import { exportAllOrdersToExcel } from "../utils/exportProductToExcel";
import { notifyInfo } from "../lib/toast";

import PageHeader from "../components/common/PageHeader";
import OrderTable from "../components/orders/OrderTable";
import { ORDER_STATUSES } from "../utils/orderStatuses";
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
  const [showLifecycleGuide, setShowLifecycleGuide] = useState(true);

  useEffect(() => {
    if (users.length === 0) dispatch(fetchUsers());
    dispatch(fetchOrders());
  }, [dispatch, users.length]);

  /** Resolves embedded vs referenced user into a display name. */
  const getCustomerName = useCallback(
    (user) => {
      if (typeof user === "object" && user?.name) return user.name;
      const idStr = typeof user === "object" ? user?._id : user;
      const found = users.find((u) => u._id === idStr);
      return found ? found.name : "Unknown";
    },
    [users],
  );

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
      const phone =
        typeof order.shippingAddress === "object"
          ? String(order.shippingAddress?.phone || "").toLowerCase()
          : "";
      const city =
        typeof order.shippingAddress === "object"
          ? String(order.shippingAddress?.city || "").toLowerCase()
          : "";
      const paymentMethod = String(order.paymentMethod || "").toLowerCase();
      const paymentStatus = String(order.paymentStatus || "").toLowerCase();

      return (
        String(order._id || "").toLowerCase().includes(q) ||
        getCustomerName(order.user).toLowerCase().includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        city.includes(q) ||
        paymentMethod.includes(q) ||
        paymentStatus.includes(q) ||
        String(order.orderStatus || "").toLowerCase().includes(q) ||
        String(order.couponCode || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, status, getCustomerName]);

  const openCount = (statusCounts.Pending || 0) + (statusCounts.Processing || 0);

  /** Revenue = confirmed payments only — Pending/Failed/Refunded aur
   *  Cancelled orders revenue nahi hote (fake gateway revenue nahi). */
  const revenue = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.orderStatus !== "Cancelled" &&
            o.paymentStatus === "Completed",
        )
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [orders],
  );

  const handleExport = () => {
    if (!orders.length) {
      notifyInfo("Nothing to export", "No orders have been placed yet.");
      return;
    }
    exportAllOrdersToExcel(orders, getCustomerName);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus(null);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders, track parcel fulfilment, and update status from checkout to delivery."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>{formatCurrency(revenue, { compact: true })}</b> revenue
            </span>
            <span className="meta-chip">
              <b>{orders.length}</b> total orders
            </span>
            <span
              className={`meta-chip ${
                openCount > 0 ? "meta-chip-warning" : ""
              }`}
            >
              <b>{openCount}</b> awaiting packing/dispatch
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
              title="Refresh order list"
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="btn btn-export"
              title="Export all orders to Excel"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Excel
            </button>
          </>
        }
      />

      {/* 5-10 Second Non-Technical Admin Fulfilment Guide Ribbon */}
      {showLifecycleGuide && (
        <div className="mb-4 p-3.5 rounded-(--radius) border border-(--border) bg-(--surface-card) shadow-2xs flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-(--brand-soft) text-(--brand) flex items-center justify-center font-bold text-[11px] shrink-0">
              ✓
            </span>
            <div>
              <span className="font-bold text-(--ink)">
                Quick Fulfilment Flow:
              </span>{" "}
              <span className="text-(--ink-muted) hidden md:inline">
                Move orders through these 4 stages as parcels are prepared:
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>1. Pending (Received)</span>
            </div>
            <span className="text-(--ink-faint)">&rarr;</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>2. Processing (Packing)</span>
            </div>
            <span className="text-(--ink-faint)">&rarr;</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-800 dark:text-blue-300 font-semibold border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>3. Shipped (In Transit)</span>
            </div>
            <span className="text-(--ink-faint)">&rarr;</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>4. Delivered (Doorstep)</span>
            </div>

            <button
              onClick={() => setShowLifecycleGuide(false)}
              className="ml-2 text-(--ink-faint) hover:text-(--ink) text-[11px] underline cursor-pointer"
              title="Dismiss guide"
            >
              Hide
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Order ID, customer name, email, coupon…"
        />
        <SegmentedFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: orders.length },
            ...ORDER_STATUSES.map((s) => ({
              value: s,
              label: s,
              count: statusCounts[s] || 0,
            })),
          ]}
        />
      </div>

      {(search || status) && filteredOrders.length === 0 && (
        <div className="mb-3 flex items-center justify-between p-2.5 rounded-(--radius) bg-(--surface-sunken) text-[12px] text-(--ink-muted)">
          <span>
            No orders match current filter:{" "}
            <b>{status ? `Status: ${status}` : ""}</b>{" "}
            {search ? `"${search}"` : ""}
          </span>
          <button
            onClick={clearFilters}
            className="text-(--brand) font-semibold hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      <ErrorBanner message={error} onRetry={() => dispatch(fetchOrders())} />

      {loading && orders.length === 0 ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <OrderTable
          orders={filteredOrders}
          onView={(id) => setViewOrderId(id)}
        />
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

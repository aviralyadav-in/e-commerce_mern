import React, { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../features/users/usersSlice";
import { fetchCategories } from "../features/categories/categoriesSlice";
import { fetchProducts } from "../features/products/productsSlice";
import { fetchOrders } from "../features/orders/ordersSlice";

import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import RevenueChart from "../components/dashboard/RevenueChart";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  shortId,
} from "../utils/format";
import {
  BagIcon,
  CheckCircleIcon,
  PackageIcon,
  RupeeIcon,
  UsersIcon,
} from "../components/common/Icon";

const STATUS_BADGE = {
  Pending: "badge-warning",
  Processing: "badge-info",
  Shipped: "badge-brand",
  Delivered: "badge-success",
  Cancelled: "badge-danger",
};

/** Pipeline bar colour per stage, so the mix is readable at a glance. */
const STATUS_BAR = {
  Pending: "var(--warning)",
  Processing: "var(--info)",
  Shipped: "var(--brand)",
  Delivered: "var(--success)",
  Cancelled: "var(--danger)",
};

const DAY = 24 * 60 * 60 * 1000;
const LOW_STOCK = 5;

/** Cancelled orders never became money, so they stay out of revenue. */
const isRevenue = (order) => order.orderStatus !== "Cancelled";

/** Reference instant for the trailing-window comparisons. */
const nowMs = () => Date.now();

/** Last millisecond of today, so the newest bucket covers the whole day. */
const endOfToday = () => {
  const d = new Date(nowMs());
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

const orderTime = (order) => {
  const raw = order.createdAt || order.orderDate;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

const DashboardPage = () => {
  const dispatch = useDispatch();

  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { categories, loading: catLoading } = useSelector(
    (state) => state.categories,
  );
  const { products, loading: prodLoading } = useSelector(
    (state) => state.products,
  );
  const { orders, loading: ordersLoading } = useSelector(
    (state) => state.orders,
  );

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchCategories());
    dispatch(fetchProducts({ limit: 100 }));
    dispatch(fetchOrders());
  }, [dispatch]);

  const isLoading = usersLoading || catLoading || prodLoading || ordersLoading;

  const stats = useMemo(() => {
    const now = nowMs();
    const paid = orders.filter(isRevenue);

    const revenue = paid.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const last30 = paid.filter((o) => now - orderTime(o) < 30 * DAY);
    const prev30 = paid.filter((o) => {
      const age = now - orderTime(o);
      return age >= 30 * DAY && age < 60 * DAY;
    });

    const sum = (list) =>
      list.reduce((total, o) => total + (o.totalAmount || 0), 0);

    /** Percent change vs the previous window; null when there's no baseline. */
    const delta = (current, before) => {
      if (!before) return null;
      const pct = Math.round(((current - before) / before) * 100);
      return {
        value: `${pct > 0 ? "+" : ""}${pct}%`,
        direction: pct < 0 ? "down" : "up",
      };
    };

    const statusCounts = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    orders.forEach((o) => {
      if (statusCounts[o.orderStatus] !== undefined) {
        statusCounts[o.orderStatus] += 1;
      }
    });

    return {
      revenue,
      revenueTrend: delta(sum(last30), sum(prev30)),
      orderTrend: delta(last30.length, prev30.length),
      openOrders: statusCounts.Pending + statusCounts.Processing,
      statusCounts,
      avgOrder: paid.length ? revenue / paid.length : 0,
      newUsers: users.filter((u) => {
        const t = u.createdAt ? new Date(u.createdAt).getTime() : NaN;
        return !Number.isNaN(t) && now - t < 30 * DAY;
      }).length,
    };
  }, [orders, users]);

  /** Daily revenue for the trailing fortnight, oldest first. */
  const series = useMemo(() => {
    const end = endOfToday();
    const buckets = Array.from({ length: 14 }, (_, i) => ({
      label: formatDate(end - (13 - i) * DAY),
      value: 0,
    }));
    orders.filter(isRevenue).forEach((o) => {
      const age = end - orderTime(o);
      const index = 13 - Math.floor(age / DAY);
      if (index >= 0 && index < 14) {
        buckets[index].value += o.totalAmount || 0;
      }
    });
    return buckets;
  }, [orders]);

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => (p.stock ?? 0) <= LOW_STOCK)
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        .slice(0, 6),
    [products],
  );

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => orderTime(b) - orderTime(a)).slice(0, 6),
    [orders],
  );

  if (isLoading && !orders.length && !products.length) {
    return <Loader />;
  }

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard"
        subtitle={`Store overview · ${todayLabel}`}
        meta={
          <>
            <span className="meta-chip meta-chip-brand">
              <b>{formatCurrency(stats.avgOrder, { compact: true })}</b> avg
              order
            </span>
            <span className="meta-chip meta-chip-warning">
              <b>{stats.openOrders}</b> awaiting action
            </span>
            <span className="meta-chip">
              <b>{categories.length}</b> categories
            </span>
          </>
        }
        actions={
          <>
            <Link to="/products" className="btn btn-secondary">
              Products
            </Link>
            <Link to="/orders" className="btn btn-primary">
              View orders
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Revenue"
          count={formatCurrency(stats.revenue, { compact: true })}
          accent="green"
          hint="Excludes cancelled orders"
          trend={stats.revenueTrend}
          icon={<RupeeIcon />}
        />
        <StatCard
          title="Orders"
          count={formatNumber(orders.length)}
          accent="blue"
          hint={`${stats.openOrders} open`}
          trend={stats.orderTrend}
          icon={<BagIcon />}
        />
        <StatCard
          title="Products"
          count={formatNumber(products.length)}
          accent="orange"
          hint={
            lowStock.length
              ? `${lowStock.length} need restocking`
              : "Stock levels healthy"
          }
          icon={<PackageIcon />}
        />
        <StatCard
          title="Customers"
          count={formatNumber(users.length)}
          accent="slate"
          hint={`${stats.newUsers} joined in 30 days`}
          icon={<UsersIcon />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-4">
        <div className="xl:col-span-8">
          <RevenueChart data={series} />
        </div>

        {/* Order pipeline */}
        <div className="admin-card p-4 xl:col-span-4">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="admin-card-title">Order pipeline</h2>
            <Link to="/orders" className="admin-link">
              Manage
            </Link>
          </div>
          {orders.length ? (
            <div className="space-y-3">
              {Object.entries(stats.statusCounts).map(([status, count]) => {
                const pct = orders.length
                  ? Math.round((count / orders.length) * 100)
                  : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="font-medium text-(--ink-soft)">
                        {status}
                      </span>
                      <span className="text-(--ink-muted) tabular-nums">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="meter">
                      <span
                        style={{
                          width: `${pct}%`,
                          background: STATUS_BAR[status],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12.5px] text-(--ink-faint) py-6 text-center">
              No orders to break down yet.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Low stock */}
        <div className="admin-card xl:col-span-5 overflow-hidden">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Low stock inventory</h2>
            <Link to="/products" className="admin-link">
              View products
            </Link>
          </div>
          {lowStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product._id}>
                      <td className="max-w-50">
                        <span className="cell-strong block truncate">
                          {product.name}
                        </span>
                      </td>
                      <td>
                        <span className="code-chip">{product.sku || "—"}</span>
                      </td>
                      <td className="text-right">
                        <span
                          className={`badge ${
                            (product.stock ?? 0) === 0
                              ? "badge-danger"
                              : "badge-warning"
                          }`}
                        >
                          {product.stock ?? 0} left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              compact
              icon={<CheckCircleIcon className="w-5 h-5" />}
              title="Stock looks healthy"
              message={`Nothing is down to ${LOW_STOCK} units or fewer.`}
            />
          )}
        </div>

        {/* Recent orders */}
        <div className="admin-card xl:col-span-7 overflow-hidden">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Recent orders</h2>
            <Link to="/orders" className="admin-link">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <Link
                          to="/orders"
                          className="font-mono text-[12px] font-semibold text-(--ink) hover:text-(--brand)"
                        >
                          {shortId(order._id)}
                        </Link>
                      </td>
                      <td className="max-w-40">
                        <span className="cell-strong block truncate">
                          {typeof order.user === "object"
                            ? order.user?.name || "—"
                            : "—"}
                        </span>
                      </td>
                      <td className="text-(--ink-muted) whitespace-nowrap">
                        {formatDate(order.createdAt || order.orderDate)}
                      </td>
                      <td className="text-right font-semibold tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            STATUS_BADGE[order.orderStatus] || "badge-neutral"
                          }`}
                        >
                          <span className="badge-dot" />
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              compact
              icon={<BagIcon className="w-5 h-5" />}
              title="No orders yet"
              message="Orders will appear here as soon as customers check out."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

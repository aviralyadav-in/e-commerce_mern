import { useEffect, useMemo } from "react";
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
    <div className="page-shell space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div
          className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"
        />
        <div
          className="absolute right-1/3 -bottom-10 w-60 h-60 rounded-full bg-purple-500/15 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold tracking-wide">
                STORE OVERVIEW
              </span>
              <span className="text-[12px] text-slate-400 font-medium">
                {todayLabel}
              </span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-white">
              Welcome back, Admin 👋
            </h1>
            <p className="text-[13px] text-slate-300 mt-1 max-w-xl">
              Here is your real-time store performance, sales momentum, and inventory health for today.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/products"
              className="btn bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm transition-all"
            >
              <PackageIcon className="w-4 h-4 text-indigo-300" />
              <span>Manage Products</span>
            </Link>
            <Link
              to="/orders"
              className="btn btn-primary shadow-lg shadow-indigo-500/30"
            >
              <BagIcon className="w-4 h-4 text-white" />
              <span>View All Orders</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          count={formatCurrency(stats.revenue, { compact: true })}
          accent="green"
          hint="Calculated across all paid orders"
          trend={stats.revenueTrend}
          icon={<RupeeIcon />}
        />
        <StatCard
          title="Total Orders"
          count={formatNumber(orders.length)}
          accent="indigo"
          hint={`${stats.openOrders} orders awaiting processing`}
          trend={stats.orderTrend}
          icon={<BagIcon />}
        />
        <StatCard
          title="Active Products"
          count={formatNumber(products.length)}
          accent="purple"
          hint={
            lowStock.length
              ? `${lowStock.length} items running low on stock`
              : "Inventory levels healthy"
          }
          icon={<PackageIcon />}
        />
        <StatCard
          title="Registered Customers"
          count={formatNumber(users.length)}
          accent="blue"
          hint={`${stats.newUsers} new signups in past 30 days`}
          icon={<UsersIcon />}
        />
      </div>

      {/* Analytics & Pipeline Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <RevenueChart data={series} />
        </div>

        {/* Order Pipeline Widget */}
        <div className="admin-card p-5 xl:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <h2 className="admin-card-title text-[15px]">Order Pipeline</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Status breakdown of current sales</p>
              </div>
              <Link to="/orders" className="admin-link font-semibold">
                Manage →
              </Link>
            </div>

            {orders.length ? (
              <div className="space-y-3 mt-3">
                {Object.entries(stats.statusCounts).map(([status, count]) => {
                  const pct = orders.length
                    ? Math.round((count / orders.length) * 100)
                    : 0;
                  return (
                    <div key={status} className="group">
                      <div className="flex justify-between items-center text-[12.5px] mb-1.5 font-medium">
                        <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full ring-2 ring-white/10"
                            style={{ background: STATUS_BAR[status] }}
                          />
                          <span className="font-semibold">{status}</span>
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 tabular-nums font-bold text-[12px]">
                          {count} <span className="font-medium text-slate-400 dark:text-slate-500">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
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
              <p className="text-[13px] text-slate-400 dark:text-slate-500 py-8 text-center font-medium">
                No orders recorded yet.
              </p>
            )}
          </div>

          <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400">
            <span>Active Volume: <b className="text-slate-800 dark:text-slate-200">{stats.openOrders} orders</b></span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Avg Order: {formatCurrency(stats.avgOrder, { compact: true })}</span>
          </div>
        </div>
      </div>

      {/* Tables Grid: Low Stock & Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Low Stock Alerts */}
        <div className="admin-card xl:col-span-5 overflow-hidden flex flex-col">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Inventory Alerts</h2>
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium">Products requiring replenishment</p>
            </div>
            <Link to="/products" className="admin-link">
              All Products
            </Link>
          </div>
          {lowStock.length > 0 ? (
            <div className="overflow-x-auto flex-1 admin-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Units Left</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="max-w-50">
                        <span className="cell-strong block truncate text-[13px]">
                          {product.name}
                        </span>
                      </td>
                      <td>
                        <span className="code-chip font-mono text-[11px]">{product.sku || "—"}</span>
                      </td>
                      <td className="text-right">
                        <span
                          className={`badge ${
                            (product.stock ?? 0) === 0
                              ? "badge-danger"
                              : "badge-warning"
                          }`}
                        >
                          <span className="badge-dot" />
                          {product.stock ?? 0} in stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                compact
                icon={<CheckCircleIcon className="w-6 h-6 text-emerald-600" />}
                title="Stock is optimal"
                message={`All product stocks are well above the warning threshold (${LOW_STOCK} units).`}
              />
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="admin-card xl:col-span-7 overflow-hidden flex flex-col">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Recent Transactions</h2>
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium">Latest incoming customer orders</p>
            </div>
            <Link to="/orders" className="admin-link">
              View All Orders
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto flex-1 admin-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td>
                        <Link
                          to="/orders"
                          className="font-mono text-[12px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {shortId(order._id)}
                        </Link>
                      </td>
                      <td className="max-w-40">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white text-[10.5px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {typeof order.user === "object" && order.user?.name
                              ? order.user.name.charAt(0).toUpperCase()
                              : "C"}
                          </div>
                          <span className="cell-strong block truncate text-[12.5px]">
                            {typeof order.user === "object"
                              ? order.user?.name || "Customer"
                              : "Customer"}
                          </span>
                        </div>
                      </td>
                      <td className="text-slate-500 dark:text-slate-400 text-[12px] whitespace-nowrap">
                        {formatDate(order.createdAt || order.orderDate)}
                      </td>
                      <td className="text-right font-bold text-(--ink) tabular-nums text-[13px]">
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
            <div className="p-8">
              <EmptyState
                compact
                icon={<BagIcon className="w-6 h-6 text-indigo-600" />}
                title="No orders yet"
                message="Transactions will appear here as soon as customers checkout."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

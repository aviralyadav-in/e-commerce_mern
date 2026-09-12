import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, bulkCreateUsers } from "../features/users/usersSlice";
import { fetchOrders } from "../features/orders/ordersSlice";
import { exportAllUsersToExcel } from "../utils/exportProductToExcel";
import { notifyInfo } from "../lib/toast";

import PageHeader from "../components/common/PageHeader";
import UserTable from "../components/users/UserTable";
import UserModal from "../components/users/UserModal";
import BulkUploadModal from "../components/common/BulkUploadModal";
import { downloadUsersSampleCsv } from "../utils/csvTemplates";
import SearchInput from "../components/common/SearchInput";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import {
  DownloadIcon,
  PlusIcon,
  UploadIcon,
  UsersIcon,
  BagIcon,
  InfoIcon,
  ChevronDownIcon,
  XIcon,
} from "../components/common/Icon";

/** Registrations in the last 30 days, for the header chip. */
const isRecent = (createdAt) => {
  if (!createdAt) return false;
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < 30 * 24 * 60 * 60 * 1000;
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const { orders } = useSelector((state) => state.orders);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'buyers' | 'new' | 'no_orders'
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("niya_customer_guide_dismissed") !== "true";
  });

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchOrders());
  }, [dispatch]);

  // Aggregate orders and lifetime spend (LTV) per customer
  const customerMetrics = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      map[u._id] = { ordersCount: 0, totalSpend: 0, lastOrderDate: null };
    });

    (orders || []).forEach((o) => {
      const uId = typeof o.user === "object" ? o.user?._id : o.user;
      if (!uId) return;

      if (!map[uId]) {
        map[uId] = { ordersCount: 0, totalSpend: 0, lastOrderDate: null };
      }

      map[uId].ordersCount += 1;
      if (o.orderStatus !== "Cancelled") {
        map[uId].totalSpend += Number(o.totalAmount || 0);
      }

      if (o.createdAt) {
        const orderTime = new Date(o.createdAt).getTime();
        if (!map[uId].lastOrderDate || orderTime > map[uId].lastOrderDate) {
          map[uId].lastOrderDate = orderTime;
        }
      }
    });

    return map;
  }, [users, orders]);

  // Counts for tabs & summary
  const counts = useMemo(() => {
    let buyers = 0;
    let recent = 0;
    let noOrders = 0;
    let totalSpend = 0;

    (users || []).forEach((u) => {
      const metrics = customerMetrics[u._id] || { ordersCount: 0, totalSpend: 0 };
      if (metrics.ordersCount > 0) buyers += 1;
      else noOrders += 1;
      if (isRecent(u.createdAt)) recent += 1;
      totalSpend += metrics.totalSpend;
    });

    return {
      all: (users || []).length,
      buyers,
      new: recent,
      noOrders,
      totalSpend,
    };
  }, [users, customerMetrics]);

  // Filtering by search & activeTab (supports name, email, phone, and customer ID)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (users || []).filter((u) => {
      const metrics = customerMetrics[u._id] || { ordersCount: 0 };

      // Tab filter
      if (activeTab === "buyers" && metrics.ordersCount === 0) return false;
      if (activeTab === "no_orders" && metrics.ordersCount > 0) return false;
      if (activeTab === "new" && !isRecent(u.createdAt)) return false;

      // Text query (searches Name, Email, Phone, and Customer ID)
      if (!q) return true;
      return (
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phone || "").toLowerCase().includes(q) ||
        String(u._id || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, activeTab, customerMetrics]);

  const openAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (!users.length) {
      notifyInfo("Nothing to export", "No customers registered yet.");
      return;
    }
    exportAllUsersToExcel(users, customerMetrics);
  };

  const handleBulkUpload = async (formData) => {
    const result = await dispatch(bulkCreateUsers(formData));
    if (bulkCreateUsers.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload || "Bulk import failed");
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("niya_customer_guide_dismissed", "true");
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts, purchase history, and lifetime store value."
        meta={
          <>
            <span className="meta-chip">
              <UsersIcon className="w-3.5 h-3.5 text-(--brand)" />
              <b>{counts.all}</b> registered
            </span>
            <span className="meta-chip meta-chip-success">
              <BagIcon className="w-3.5 h-3.5 text-emerald-600" />
              <b>{counts.buyers}</b> active buyers
            </span>
            <span className="meta-chip">
              <b>{counts.new}</b> joined this month
            </span>
            {counts.totalSpend > 0 && (
              <span className="meta-chip font-medium text-emerald-700 dark:text-emerald-400">
                ₹{counts.totalSpend.toLocaleString("en-IN")} total spend
              </span>
            )}
          </>
        }
        actions={
          <>
            <button onClick={handleExport} className="btn btn-export">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="btn btn-secondary"
            >
              <UploadIcon className="w-4 h-4" />
              Import CSV
            </button>
            <button onClick={openAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add customer
            </button>
          </>
        }
      />

      {/* 5-10 Second Admin CRM Guide Banner */}
      {showGuide && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-linear-to-r from-indigo-50/90 via-violet-50/70 to-slate-50/80 dark:from-indigo-950/40 dark:via-violet-950/20 dark:to-slate-900/40 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <InfoIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight">
                  Customer Management & CRM Guide
                </h3>
                <p className="text-[11.5px] text-indigo-700/80 dark:text-indigo-300/80 font-normal">
                  Everything you need to manage shoppers, order history & customer reach:
                </p>
              </div>
            </div>
            <button
              onClick={dismissGuide}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Dismiss guide"
              aria-label="Dismiss guide"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 text-[12px]">
            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">👥</span>
              <div>
                <span className="font-semibold text-(--ink) block">Customer Directory</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  View storefront accounts or manually add new customers with password.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">🛍️</span>
              <div>
                <span className="font-semibold text-(--ink) block">Orders & Spend (LTV)</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  See how many orders each customer placed & total lifetime rupees spent.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">💬</span>
              <div>
                <span className="font-semibold text-(--ink) block">1-Click Quick Reach</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Copy Email/Phone with 1-click or start a WhatsApp / Email chat instantly.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">📥</span>
              <div>
                <span className="font-semibold text-(--ink) block">Import & Export</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Bulk import customers via CSV or export complete list to Excel anytime.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Filter Tabs & Search Bar */}
      <div className="space-y-2.5 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-(--surface-card) border border-(--border) rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>All Customers</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === "all" ? "bg-white/25 text-white" : "bg-(--surface-sunken) text-(--ink-muted)"
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("buyers")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "buyers"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>Active Buyers</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === "buyers" ? "bg-white/25 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              }`}>
                {counts.buyers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "new"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>New (30 Days)</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === "new" ? "bg-white/25 text-white" : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              }`}>
                {counts.new}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("no_orders")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "no_orders"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>No Orders Yet</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === "no_orders" ? "bg-white/25 text-white" : "bg-(--surface-sunken) text-(--ink-muted)"
              }`}>
                {counts.noOrders}
              </span>
            </button>
          </div>

          {!showGuide && (
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="text-[11.5px] text-(--brand) hover:underline flex items-center gap-1 ml-auto font-medium"
            >
              <InfoIcon className="w-3.5 h-3.5" />
              Show CRM Guide
            </button>
          )}
        </div>

        <div className="admin-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customer name, email or phone number…"
          />
        </div>
      </div>

      {!isModalOpen && (
        <ErrorBanner message={error} onRetry={() => dispatch(fetchUsers())} />
      )}

      {loading && users.length === 0 ? (
        <TableSkeleton rows={8} columns={6} hasThumb />
      ) : (
        <UserTable
          users={filtered}
          customerMetrics={customerMetrics}
          onCreate={openAdd}
          onEdit={(u) => {
            setEditData(u);
            setIsModalOpen(true);
          }}
        />
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
      />

      {/* CSV bulk import */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Import customers via CSV"
        subtitle="Ek hi file me multiple customers — har row ek naya customer account."
        uploadHint={
          <>
            Required columns: <b>name</b>, <b>email</b>, <b>password</b> (min 8
            chars, har customer ka alag). Optional: <b>phone</b> (10-digit
            Indian), <b>gender</b> (male/female), <b>dateOfBirth</b> (YYYY-MM-DD).
            Duplicate emails auto-skip ho jaate hain.
          </>
        }
        onDownloadSample={downloadUsersSampleCsv}
        onSubmit={handleBulkUpload}
      />
    </div>
  );
};

export default UsersPage;


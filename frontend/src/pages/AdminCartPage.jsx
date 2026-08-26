import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCarts } from "../features/adminCart/adminCartSlice";
import { exportAllCartsToExcel } from "../utils/exportProductToExcel";
import { toastInfo } from "../features/ui/uiSlice";

import AdminCartTable from "../components/adminCart/AdminCartTable";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { formatCurrency } from "../utils/format";
import { DownloadIcon, RefreshIcon } from "../components/common/Icon";

const AdminCartPage = () => {
  const dispatch = useDispatch();
  const { carts, totalEntries, loading, error } = useSelector(
    (state) => state.adminCart,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllCarts());
  }, [dispatch]);

  /** Value sitting in carts right now, and how many customers it belongs to. */
  const insights = useMemo(() => {
    const customers = new Set();
    let value = 0;
    carts.forEach((c) => {
      if (c.userEmail || c.userName) customers.add(c.userEmail || c.userName);
      value += Number(c.itemTotal) || 0;
    });
    return { customers: customers.size, value };
  }, [carts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return carts;
    return carts.filter(
      (item) =>
        String(item.userName || "").toLowerCase().includes(q) ||
        String(item.userEmail || "").toLowerCase().includes(q) ||
        String(item.productName || "").toLowerCase().includes(q),
    );
  }, [carts, search]);

  const handleExportAll = () => {
    if (!carts.length) {
      dispatch(toastInfo("Nothing to export", "No active carts right now."));
      return;
    }
    exportAllCartsToExcel(carts);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Customer carts"
        subtitle="Items sitting in carts but not yet checked out — your abandoned-cart pipeline."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>{formatCurrency(insights.value)}</b> in carts
            </span>
            <span className="meta-chip">
              <b>{totalEntries ?? carts.length}</b> cart items
            </span>
            <span className="meta-chip meta-chip-info">
              <b>{insights.customers}</b> customers
            </span>
          </>
        }
        actions={
          <>
            <button
              onClick={() => dispatch(fetchAllCarts())}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportAll}
              title="Download all carts as Excel"
              className="btn btn-export"
            >
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
          placeholder="Search by customer or product…"
        />
      </div>

      <ErrorBanner message={error} onRetry={() => dispatch(fetchAllCarts())} />

      {loading && carts.length === 0 ? (
        <TableSkeleton rows={6} columns={6} hasThumb />
      ) : (
        <AdminCartTable carts={filtered} />
      )}
    </div>
  );
};

export default AdminCartPage;

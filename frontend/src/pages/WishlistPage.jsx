import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllWishlists } from "../features/wishlist/wishlistSlice";
import { exportAllWishlistsToExcel } from "../utils/exportProductToExcel";
import { notifyInfo } from "../lib/toast";

import WishlistTable from "../components/wishlist/WishlistTable";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, RefreshIcon } from "../components/common/Icon";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { wishlists, totalEntries, loading, error } = useSelector(
    (state) => state.wishlist,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllWishlists());
  }, [dispatch]);

  /** Distinct customers and the single most-saved product. */
  const insights = useMemo(() => {
    const customers = new Set();
    const productTally = {};
    wishlists.forEach((w) => {
      if (w.userEmail || w.userName) customers.add(w.userEmail || w.userName);
      const name = w.productName;
      if (name) productTally[name] = (productTally[name] || 0) + 1;
    });
    const top = Object.entries(productTally).sort((a, b) => b[1] - a[1])[0];
    return { customers: customers.size, top: top ? top[0] : null };
  }, [wishlists]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return wishlists;
    return wishlists.filter(
      (item) =>
        String(item.userName || "").toLowerCase().includes(q) ||
        String(item.userEmail || "").toLowerCase().includes(q) ||
        String(item.productName || "").toLowerCase().includes(q),
    );
  }, [wishlists, search]);

  const handleExportAll = () => {
    if (!wishlists.length) {
      notifyInfo("Nothing to export", "No products saved yet.");
      return;
    }
    exportAllWishlistsToExcel(wishlists);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Wishlists"
        subtitle="Products customers saved for later — a read-only view of buying intent."
        meta={
          <>
            <span className="meta-chip meta-chip-brand">
              <b>{totalEntries ?? wishlists.length}</b> saved items
            </span>
            <span className="meta-chip">
              <b>{insights.customers}</b> customers
            </span>
            {insights.top && (
              <span className="meta-chip meta-chip-success">
                Most saved: <b>{insights.top}</b>
              </span>
            )}
          </>
        }
        actions={
          <>
            <button
              onClick={() => dispatch(fetchAllWishlists())}
              className="btn btn-secondary"
              title="Refresh"
            >
              <RefreshIcon className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportAll}
              title="Download all wishlists as Excel"
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

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchAllWishlists())}
      />

      {loading && wishlists.length === 0 ? (
        <TableSkeleton rows={6} columns={4} hasThumb />
      ) : (
        <WishlistTable wishlists={filtered} />
      )}
    </div>
  );
};

export default WishlistPage;

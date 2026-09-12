import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  quickUpdateStock,
} from "../features/products/productsSlice";
import { fetchCategories } from "../features/categories/categoriesSlice";
import { exportAllProductsToExcel } from "../utils/exportProductToExcel";
import { formatCurrency } from "../utils/format";
import useTableControls from "../hooks/useTableControls";

import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import SortableTh from "../components/common/SortableTh";
import Thumb from "../components/common/Thumb";
import Pagination from "../components/common/Pagination";
import EmptyState from "../components/common/EmptyState";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import {
  PackageIcon,
  CheckIcon,
  RefreshIcon,
  DownloadIcon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon,
} from "../components/common/Icon";

const LOW_STOCK_THRESHOLD = 5;

const InventoryPage = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("niya_inventory_guide_dismissed") !== "true";
  });

  // Local pending stock edits: { [productId]: number }
  const [stockEdits, setStockEdits] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (products.length === 0) dispatch(fetchProducts());
    if (categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, products.length, categories.length]);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("niya_inventory_guide_dismissed", "true");
  };

  const getCategoryName = (cat) => {
    if (typeof cat === "object" && cat?.name) return cat.name;
    const catId = typeof cat === "object" ? cat?._id : cat;
    const found = categories.find((c) => c._id === catId);
    return found ? found.name : "General";
  };

  // Inventory Overview Metrics
  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    products.forEach((p) => {
      const s = Number(p.stock) || 0;
      const price = Number(p.discountPrice || p.price) || 0;
      totalValue += price * s;

      if (s === 0) outOfStock += 1;
      else if (s <= LOW_STOCK_THRESHOLD) lowStock += 1;
      else inStock += 1;
    });

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, [products]);

  // Filtered dataset before table controls
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock) || 0;

      // Status filter
      if (statusFilter === "out" && stock > 0) return false;
      if (statusFilter === "low" && (stock === 0 || stock > LOW_STOCK_THRESHOLD)) return false;
      if (statusFilter === "in" && stock <= LOW_STOCK_THRESHOLD) return false;

      // Category filter
      if (categoryFilter) {
        const pCatId = typeof p.categoryId === "object" ? p.categoryId?._id : p.categoryId;
        if (pCatId !== categoryFilter) return false;
      }

      // Search query
      if (!debouncedSearch) return true;
      const name = String(p.name || "").toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      const brand = String(p.brand || "").toLowerCase();
      return name.includes(debouncedSearch) || sku.includes(debouncedSearch) || brand.includes(debouncedSearch);
    });
  }, [products, debouncedSearch, statusFilter, categoryFilter]);

  // Standard table controls with sorting and pagination
  const table = useTableControls(filteredProducts, {
    accessors: {
      product: (p) => p.name || "",
      category: (p) => getCategoryName(p.categoryId),
      sku: (p) => p.sku || "",
      price: (p) => Number(p.discountPrice || p.price) || 0,
      stock: (p) => Number(p.stock) || 0,
    },
    initialSort: { key: "stock", dir: "asc" },
    pageSize: 10,
  });

  const handleStockInputChange = (productId, val) => {
    const num = val === "" ? "" : Math.max(0, parseInt(val, 10) || 0);
    setStockEdits((prev) => ({
      ...prev,
      [productId]: num,
    }));
  };

  const handleQuickAdd = async (productId, currentStock, delta) => {
    setUpdatingId(productId);
    const newStock = Math.max(0, currentStock + delta);
    const res = await dispatch(quickUpdateStock({ id: productId, stock: newStock }));
    if (!res.error) {
      setStockEdits((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
    setUpdatingId(null);
  };

  const handleSaveStock = async (productId) => {
    const editedVal = stockEdits[productId];
    if (editedVal === undefined || editedVal === "") return;

    setUpdatingId(productId);
    const res = await dispatch(
      quickUpdateStock({ id: productId, stock: Number(editedVal) }),
    );
    if (!res.error) {
      setStockEdits((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
    setUpdatingId(null);
  };

  const handleCancelStockEdit = (productId) => {
    setStockEdits((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleExport = () => {
    exportAllProductsToExcel(filteredProducts, getCategoryName);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Inventory"
        subtitle="Fast single-screen stock ledger — instant 1-click restocks, inline quantity updates, and replenishment alerts."
        meta={
          <>
            <span className="meta-chip">
              <PackageIcon className="w-3.5 h-3.5 text-(--brand)" />
              <b>{products.length}</b> total items
            </span>
            <span className="meta-chip meta-chip-success">
              <b>{stats.inStock}</b> healthy stock
            </span>
            {stats.lowStock > 0 && (
              <span className="meta-chip meta-chip-warning">
                <b>{stats.lowStock}</b> low stock
              </span>
            )}
            {stats.outOfStock > 0 && (
              <span className="meta-chip meta-chip-danger animate-pulse">
                <b>{stats.outOfStock}</b> out of stock
              </span>
            )}
            <span className="meta-chip font-medium text-emerald-700 dark:text-emerald-400">
              <b>{formatCurrency(stats.totalValue, { compact: true })}</b> inventory value
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => dispatch(fetchProducts())}
              disabled={loading}
              className="btn btn-secondary"
              title="Refresh stock ledger"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!filteredProducts.length}
              className="btn btn-export"
              title="Export all inventory records to Excel"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Excel
            </button>
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* 5-10 Second Non-Technical Admin Inventory Guide Banner */}
      {showGuide && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-linear-to-r from-indigo-50/90 via-violet-50/70 to-slate-50/80 dark:from-indigo-950/40 dark:via-violet-950/20 dark:to-slate-900/40 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <InfoIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight">
                  Stock Ledger & Inventory Restock Guide
                </h3>
                <p className="text-[11.5px] text-indigo-700/80 dark:text-indigo-300/80 font-normal">
                  Everything you need to keep store stock accurate and prevent overselling:
                </p>
              </div>
            </div>
            <button
              type="button"
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
              <span className="text-base leading-none">⚡</span>
              <div>
                <span className="font-semibold text-(--ink) block">1-Click Quick Restock</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Click <b>+5</b>, <b>+10</b>, or <b>+25</b> to add inventory in 1 second without opening modal forms.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">✏️</span>
              <div>
                <span className="font-semibold text-(--ink) block">Direct Inline Edit</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Type any exact number into the stock box and press <b>Enter</b> to save immediately.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">🔴</span>
              <div>
                <span className="font-semibold text-(--ink) block">Out of Stock Alerts</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Products with 0 stock show a red warning. Replenish them to resume customer sales.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">📥</span>
              <div>
                <span className="font-semibold text-(--ink) block">Warehouse Export</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Export complete or filtered inventory tables to Excel for supplier orders & audits.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div
          onClick={() => setStatusFilter(null)}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === null
              ? "ring-2 ring-(--brand) border-(--brand) bg-(--brand-soft)"
              : "hover:border-(--border-strong)"
          }`}
        >
          <p className="text-[12px] font-medium text-(--ink-muted)">Total Catalog Items</p>
          <p className="text-2xl font-bold text-(--ink) mt-1">{stats.total}</p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            Click to view all
          </span>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === "in" ? null : "in"))}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === "in"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10"
              : "hover:border-emerald-300 dark:hover:border-emerald-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
              Healthy Stock
            </p>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.inStock}
          </p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            {statusFilter === "in" ? "Click to clear filter" : "> 5 units available"}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === "low" ? null : "low"))}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === "low"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/10"
              : "hover:border-amber-300 dark:hover:border-amber-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
              Low Stock Warning
            </p>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.lowStock}
          </p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            {statusFilter === "low" ? "Click to clear filter" : "1 to 5 units remaining"}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === "out" ? null : "out"))}
          className={`admin-card p-3.5 cursor-pointer transition-all ${
            statusFilter === "out"
              ? "ring-2 ring-red-500 border-red-500 bg-red-500/10"
              : "hover:border-red-300 dark:hover:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">
              Out of Stock
            </p>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {stats.outOfStock}
          </p>
          <span className="text-[11px] text-(--ink-faint) mt-0.5 block">
            {statusFilter === "out" ? "Click to clear filter" : "0 units (Replenish now)"}
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by product name, SKU, brand…"
        />

        <SegmentedFilter
          options={[
            { value: null, label: "All Items", count: stats.total },
            { value: "out", label: "Out of Stock", count: stats.outOfStock },
            { value: "low", label: "Low Stock", count: stats.lowStock },
            { value: "in", label: "Healthy Stock", count: stats.inStock },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="admin-select"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Standard Admin Table Card */}
      {loading && products.length === 0 ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="admin-table-wrap">
          <div className="overflow-x-auto admin-scroll">
            <table className="admin-table min-w-245">
              <thead>
                <tr>
                  <SortableTh
                    label="Product"
                    sortKey="product"
                    sort={table.sort}
                    onSort={table.toggleSort}
                  />
                  <SortableTh
                    label="Category"
                    sortKey="category"
                    sort={table.sort}
                    onSort={table.toggleSort}
                  />
                  <SortableTh
                    label="SKU"
                    sortKey="sku"
                    sort={table.sort}
                    onSort={table.toggleSort}
                  />
                  <SortableTh
                    label="Selling Price"
                    sortKey="price"
                    sort={table.sort}
                    onSort={table.toggleSort}
                    align="right"
                  />
                  <th scope="col" className="text-center">
                    Status
                  </th>
                  <SortableTh
                    label="Current Stock"
                    sortKey="stock"
                    sort={table.sort}
                    onSort={table.toggleSort}
                    align="center"
                  />
                  <th scope="col" className="text-right">
                    Quick Restock Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.length > 0 ? (
                  table.rows.map((p) => {
                    const stock = Number(p.stock) || 0;
                    const hasPending = stockEdits[p._id] !== undefined;
                    const displayValue = hasPending ? stockEdits[p._id] : stock;
                    const isUpdating = updatingId === p._id;

                    let statusBadge = (
                      <span className="badge badge-success badge-dot">
                        In Stock ({stock})
                      </span>
                    );

                    if (stock === 0) {
                      statusBadge = (
                        <span className="badge badge-danger badge-dot animate-pulse">
                          Out of Stock
                        </span>
                      );
                    } else if (stock <= LOW_STOCK_THRESHOLD) {
                      statusBadge = (
                        <span className="badge badge-warning badge-dot">
                          Low ({stock} left)
                        </span>
                      );
                    }

                    return (
                      <tr key={p._id}>
                        {/* Product Thumbnail + Name */}
                        <td>
                          <div className="flex items-center gap-3">
                            <Thumb
                              src={p.images?.desktop?.[0] || p.images?.mobile?.[0]}
                              alt={p.name}
                              className="w-10 h-10"
                              rounded="rounded-xl"
                            />
                            <div className="min-w-0">
                              <p className="cell-strong truncate max-w-60 text-[13px]">
                                {p.name}
                              </p>
                              <span className="cell-sub truncate max-w-60">
                                {p.brand || "Standard Collection"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="whitespace-nowrap">
                          <span className="badge badge-neutral">
                            {getCategoryName(p.categoryId)}
                          </span>
                        </td>

                        {/* SKU */}
                        <td className="whitespace-nowrap">
                          <span className="code-chip">
                            {p.sku || "N/A"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="text-right font-semibold text-(--ink) whitespace-nowrap">
                          {formatCurrency(p.discountPrice || p.price)}
                        </td>

                        {/* Status */}
                        <td className="text-center whitespace-nowrap">
                          {statusBadge}
                        </td>

                        {/* Current Stock Editable Input */}
                        <td className="text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <input
                              type="number"
                              min="0"
                              value={displayValue}
                              onChange={(e) =>
                                handleStockInputChange(p._id, e.target.value)
                              }
                              onBlur={() => {
                                if (stockEdits[p._id] === "" || stockEdits[p._id] === stock) {
                                  handleCancelStockEdit(p._id);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveStock(p._id);
                                } else if (e.key === "Escape") {
                                  handleCancelStockEdit(p._id);
                                }
                              }}
                              disabled={isUpdating}
                              aria-label={`Stock quantity for ${p.name}`}
                              className={`w-16 h-8 text-center font-mono font-bold text-[13px] rounded-(--radius-sm) border transition-all outline-none ${
                                hasPending
                                  ? "border-(--brand) bg-(--brand-soft) text-(--brand) ring-2 ring-(--brand-ring)"
                                  : stock === 0
                                    ? "border-red-300 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                                    : "border-(--border) bg-(--surface-card) text-(--ink) hover:border-(--border-strong) focus:border-(--brand) focus:ring-2 focus:ring-(--brand-ring)"
                              }`}
                            />
                            {hasPending && (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveStock(p._id)}
                                  disabled={isUpdating}
                                  title="Save quantity (Enter)"
                                  className="icon-btn icon-btn-view h-8 w-8 text-emerald-600 dark:text-emerald-400"
                                >
                                  <CheckIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelStockEdit(p._id)}
                                  disabled={isUpdating}
                                  title="Cancel edit (Esc)"
                                  className="icon-btn icon-btn-delete h-8 w-8 text-(--ink-muted)"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 1-Click Quick Restock Buttons */}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(p._id, stock, 5)}
                              disabled={isUpdating}
                              className="btn btn-secondary btn-sm px-2.5 font-bold"
                              title="Add 5 units instantly"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(p._id, stock, 10)}
                              disabled={isUpdating}
                              className="btn btn-secondary btn-sm px-2.5 font-bold"
                              title="Add 10 units instantly"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(p._id, stock, 25)}
                              disabled={isUpdating}
                              className="btn btn-primary btn-sm px-2.5 font-bold shadow-xs"
                              title="Add 25 units bulk restock"
                            >
                              +25
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      <EmptyState
                        icon={<PackageIcon className="w-8 h-8" />}
                        title="No matching products found"
                        message="Try clearing your search terms, status tabs, or category filter to view other items in your inventory."
                        action={
                          (search || statusFilter || categoryFilter) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearch("");
                                setStatusFilter(null);
                                setCategoryFilter("");
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Clear all filters
                            </button>
                          )
                        }
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
            noun="products"
          />
        </div>
      )}
    </div>
  );
};

export default InventoryPage;

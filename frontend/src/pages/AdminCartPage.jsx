import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCarts, adminAddToCart } from "../features/adminCart/adminCartSlice";
import { fetchUsers } from "../features/users/usersSlice";
import { fetchProducts } from "../features/products/productsSlice";
import { exportAllCartsToExcel } from "../utils/exportProductToExcel";
import { notifyInfo, notifySuccess, notifyError } from "../lib/toast";

import AdminCartTable from "../components/adminCart/AdminCartTable";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import Drawer from "../components/common/Drawer";
import Thumb from "../components/common/Thumb";
import { formatCurrency, initials } from "../utils/format";
import {
  DownloadIcon,
  RefreshIcon,
  CartIcon,
  BagIcon,
  InfoIcon,
  XIcon,
  PlusIcon,
} from "../components/common/Icon";

/** Check if item was updated in last 30 days */
const isRecent = (date) => {
  if (!date) return false;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 30 * 24 * 60 * 60 * 1000;
};

const AdminCartPage = () => {
  const dispatch = useDispatch();
  const { carts, totalEntries, loading, error } = useSelector(
    (state) => state.adminCart,
  );
  const { users } = useSelector((state) => state.users);
  const { products } = useSelector((state) => state.products);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'high_value' | 'multi_qty' | 'recent'
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("niya_cart_guide_dismissed") !== "true";
  });

  // Add Cart Item Drawer State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAllCarts());
  }, [dispatch]);

  // Fetch users and products when Drawer opens if not already loaded
  useEffect(() => {
    if (isAddDrawerOpen) {
      if (!users || users.length === 0) dispatch(fetchUsers());
      if (!products || products.length === 0) dispatch(fetchProducts());
    }
  }, [isAddDrawerOpen, dispatch, users, products]);

  /** Aggregate pipeline value, high value items, and top products. */
  const insights = useMemo(() => {
    const customers = new Set();
    let totalPipelineValue = 0;
    let highValueCount = 0; // >= ₹2,000 line total
    let multiQtyCount = 0; // quantity >= 2
    let recentCount = 0;
    const topProductTally = {};

    (carts || []).forEach((c) => {
      if (c.userEmail || c.userName) customers.add(c.userEmail || c.userName);
      const total = Number(c.itemTotal) || 0;
      totalPipelineValue += total;

      if (total >= 2000) highValueCount += 1;
      if (Number(c.quantity) >= 2) multiQtyCount += 1;
      if (isRecent(c.addedAt)) recentCount += 1;

      if (c.productName) {
        topProductTally[c.productName] =
          (topProductTally[c.productName] || 0) + (Number(c.quantity) || 1);
      }
    });

    const topProduct = Object.entries(topProductTally).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      customers: customers.size,
      value: totalPipelineValue,
      highValueCount,
      multiQtyCount,
      recentCount,
      topProduct: topProduct
        ? { name: topProduct[0], qty: topProduct[1] }
        : null,
    };
  }, [carts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (carts || []).filter((item) => {
      // Tab filter
      if (activeTab === "high_value") {
        if ((Number(item.itemTotal) || 0) < 2000) return false;
      } else if (activeTab === "multi_qty") {
        if ((Number(item.quantity) || 0) < 2) return false;
      } else if (activeTab === "recent") {
        if (!isRecent(item.addedAt)) return false;
      }

      // Query filter
      if (!q) return true;
      return (
        String(item.userName || "").toLowerCase().includes(q) ||
        String(item.userEmail || "").toLowerCase().includes(q) ||
        String(item.userPhone || "").toLowerCase().includes(q) ||
        String(item.productName || "").toLowerCase().includes(q) ||
        String(item.productVariant || "").toLowerCase().includes(q) ||
        String(item.productId || "").toLowerCase().includes(q) ||
        String(item.userId || "").toLowerCase().includes(q) ||
        String(item.cartId || "").toLowerCase().includes(q)
      );
    });
  }, [carts, search, activeTab]);

  // Filtered customer options for Drawer selector
  const availableCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const list = users || [];
    if (!q) return list.slice(0, 30);
    return list
      .filter(
        (u) =>
          String(u.name || "").toLowerCase().includes(q) ||
          String(u.email || "").toLowerCase().includes(q) ||
          String(u.phone || "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [users, customerSearch]);

  // Filtered product options for Drawer selector
  const availableProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = (products || []).filter((p) => p.isActive !== false);
    if (!q) return list.slice(0, 30);
    return list
      .filter(
        (p) =>
          String(p.name || "").toLowerCase().includes(q) ||
          String(p.category?.name || p.categoryId?.name || "").toLowerCase().includes(q) ||
          String(p.sku || "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [products, productSearch]);

  const selectedCustomerObj = useMemo(() => {
    return (users || []).find((u) => u._id === selectedUserId);
  }, [users, selectedUserId]);

  const selectedProductObj = useMemo(() => {
    return (products || []).find((p) => p._id === selectedProductId);
  }, [products, selectedProductId]);

  const effectiveUnitPrice = useMemo(() => {
    if (!selectedProductObj) return 0;
    return selectedProductObj.discountPrice || selectedProductObj.price || 0;
  }, [selectedProductObj]);

  const lineTotalPreview = useMemo(() => {
    return effectiveUnitPrice * Math.max(1, quantity);
  }, [effectiveUnitPrice, quantity]);

  const handleExportAll = () => {
    if (!carts.length) {
      notifyInfo("Nothing to export", "No active carts right now.");
      return;
    }
    exportAllCartsToExcel(carts);
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("niya_cart_guide_dismissed", "true");
  };

  const handleOpenAddDrawer = () => {
    setSelectedUserId("");
    setSelectedProductId("");
    setSelectedVariant("");
    setQuantity(1);
    setCustomerSearch("");
    setProductSearch("");
    setFormErrors({});
    setIsAddDrawerOpen(true);
  };

  const handleCloseAddDrawer = () => {
    if (adding) return;
    setIsAddDrawerOpen(false);
    setFormErrors({});
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!selectedUserId) errors.userId = "Please select a customer";
    if (!selectedProductId) errors.productId = "Please select a product";

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) errors.quantity = "Quantity must be at least 1";

    if (selectedProductObj && qty > (selectedProductObj.stock ?? 0)) {
      errors.quantity = `Max available stock is ${selectedProductObj.stock}`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setAdding(true);
    setFormErrors({});

    try {
      await dispatch(
        adminAddToCart({
          userId: selectedUserId,
          productId: selectedProductId,
          variantName: selectedVariant || null,
          quantity: qty,
        }),
      ).unwrap();

      notifySuccess(
        "Item added to customer cart!",
        `Added ${qty}x "${selectedProductObj?.name}" for ${selectedCustomerObj?.name}`,
      );

      handleCloseAddDrawer();
    } catch (err) {
      notifyError("Failed to add item to cart", String(err));
      setFormErrors({ general: String(err) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Customer carts"
        subtitle="Items sitting in customer carts — recover abandoned checkouts into completed orders."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>{formatCurrency(insights.value)}</b> recoverable value
            </span>
            <span className="meta-chip meta-chip-brand">
              <CartIcon className="w-3.5 h-3.5 text-(--brand)" />
              <b>{totalEntries ?? carts.length}</b> cart items
            </span>
            <span className="meta-chip meta-chip-info">
              <b>{insights.customers}</b> shoppers
            </span>
            {insights.topProduct && (
              <span className="meta-chip">
                Top in cart: <b>{insights.topProduct.name}</b> (
                {insights.topProduct.qty} pcs)
              </span>
            )}
          </>
        }
        actions={
          <>
            <button
              onClick={() => dispatch(fetchAllCarts())}
              className="btn btn-secondary"
              title="Refresh cart list"
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
            <button
              onClick={handleOpenAddDrawer}
              className="btn btn-primary"
              title="Add item to a customer's cart"
            >
              <PlusIcon className="w-4 h-4" />
              Add Cart Item
            </button>
          </>
        }
      />

      {/* 5-10 Second Admin Abandoned Cart Guide Banner */}
      {showGuide && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-linear-to-r from-amber-50/90 via-orange-50/70 to-slate-50/80 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900/40 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <InfoIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight">
                  Abandoned Cart Recovery & Pipeline Guide
                </h3>
                <p className="text-[11.5px] text-amber-800/80 dark:text-amber-300/80 font-normal">
                  Convert high-intent shoppers who added products but didn't finish checkout:
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-amber-100 dark:border-amber-900/40 text-[12px]">
            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-100/60 dark:border-amber-900/30">
              <span className="text-base leading-none">🛒</span>
              <div>
                <span className="font-semibold text-(--ink) block">Active / Abandoned Carts</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Products shoppers have added to cart right now on your live storefront.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-100/60 dark:border-amber-900/30">
              <span className="text-base leading-none">💰</span>
              <div>
                <span className="font-semibold text-(--ink) block">Recoverable Value</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Total rupees ({formatCurrency(insights.value)}) waiting to become completed sales.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-100/60 dark:border-amber-900/30">
              <span className="text-base leading-none">💬</span>
              <div>
                <span className="font-semibold text-(--ink) block">1-Click WhatsApp Recovery</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Send a friendly pre-filled WhatsApp reminder with their cart items & total.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-100/60 dark:border-amber-900/30">
              <span className="text-base leading-none">⚡</span>
              <div>
                <span className="font-semibold text-(--ink) block">Top Conversion Channel</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Cart abandoners have 3x higher purchase rate when offered help or a coupon.
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
              <span>All Cart Items</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "all"
                    ? "bg-white/25 text-white"
                    : "bg-(--surface-sunken) text-(--ink-muted)"
                }`}
              >
                {carts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("high_value")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "high_value"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>💰 High Value (₹2k+)</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "high_value"
                    ? "bg-white/25 text-white"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                }`}
              >
                {insights.highValueCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("multi_qty")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "multi_qty"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>📦 Multi-Qty (2+)</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "multi_qty"
                    ? "bg-white/25 text-white"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                }`}
              >
                {insights.multiQtyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recent")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "recent"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>🕒 Recent (30 Days)</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "recent"
                    ? "bg-white/25 text-white"
                    : "bg-(--surface-sunken) text-(--ink-muted)"
                }`}
              >
                {insights.recentCount}
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
              Show Recovery Guide
            </button>
          )}
        </div>

        <div className="admin-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by customer name, email, phone or product…"
          />
        </div>
      </div>

      <ErrorBanner message={error} onRetry={() => dispatch(fetchAllCarts())} />

      {loading && carts.length === 0 ? (
        <TableSkeleton rows={6} columns={7} hasThumb />
      ) : (
        <AdminCartTable carts={filtered} />
      )}

      {/* Slide-out Drawer: Add Item to Customer Cart */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={handleCloseAddDrawer}
        title="Add Item to Customer Cart"
        subtitle="Place an item directly into a shopper's cart for telephone or WhatsApp orders"
        icon={<CartIcon className="w-5 h-5 text-(--brand)" />}
        width="max-w-xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleCloseAddDrawer}
              disabled={adding}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSubmit}
              disabled={adding || !selectedUserId || !selectedProductId}
              className="btn btn-primary"
            >
              {adding ? "Adding to Cart..." : "Add to Cart"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 rounded-xl">
              {formErrors.general}
            </div>
          )}

          {/* Live Cart Preview Card */}
          {(selectedCustomerObj || selectedProductObj) && (
            <div className="p-3.5 rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-linear-to-br from-blue-50/50 via-indigo-50/30 to-slate-50 dark:from-blue-950/30 dark:via-indigo-950/10 dark:to-slate-900/50 shadow-2xs">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-2">
                Live Cart Line Preview
              </span>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                {/* Customer Pill */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                    {initials(selectedCustomerObj?.name || "Shopper")}
                  </div>
                  <div>
                    <p className="font-semibold text-(--ink)">
                      {selectedCustomerObj?.name || "Select a customer..."}
                    </p>
                    <p className="text-(--ink-muted) text-[11px]">
                      {selectedCustomerObj?.email || "No customer selected"}
                    </p>
                  </div>
                </div>

                {/* Arrow & Qty */}
                <div className="text-center px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/70 border border-(--border)">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {quantity} × {formatCurrency(effectiveUnitPrice)}
                  </span>
                </div>

                {/* Product Pill */}
                <div className="flex items-center gap-2.5">
                  <Thumb
                    src={
                      (Array.isArray(selectedProductObj?.images?.desktop)
                        ? selectedProductObj.images.desktop[0]
                        : null) ||
                      (Array.isArray(selectedProductObj?.images)
                        ? selectedProductObj.images[0]
                        : "") ||
                      selectedProductObj?.image ||
                      ""
                    }
                    alt={selectedProductObj?.name}
                    className="w-9 h-9"
                    rounded="rounded-lg"
                    icon={<BagIcon className="w-4 h-4 text-(--ink-muted)" />}
                  />
                  <div>
                    <p className="font-semibold text-(--ink) max-w-35 truncate">
                      {selectedProductObj?.name || "Select a product..."}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[12px]">
                      Total: {formatCurrency(lineTotalPreview)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-(--ink) flex items-center justify-between">
              <span>Select Customer / Shopper *</span>
              <span className="text-[11px] text-(--ink-muted)">
                {users?.length || 0} registered accounts
              </span>
            </label>

            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customer by name, email or phone…"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-(--border) bg-(--surface-card) text-(--ink) focus:outline-hidden focus:ring-1 focus:ring-(--brand) mb-1.5"
            />

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-(--surface-card) text-(--ink) focus:outline-hidden focus:ring-2 focus:ring-(--brand) ${
                formErrors.userId ? "border-rose-500" : "border-(--border)"
              }`}
            >
              <option value="">-- Choose a customer --</option>
              {availableCustomers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email}) {u.phone ? `· +91 ${u.phone}` : ""}
                </option>
              ))}
            </select>
            {formErrors.userId && (
              <p className="text-[11px] text-rose-500">{formErrors.userId}</p>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-(--ink) flex items-center justify-between">
              <span>Select Product to Add *</span>
              <span className="text-[11px] text-(--ink-muted)">
                {products?.length || 0} catalog products
              </span>
            </label>

            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product by title or SKU…"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-(--border) bg-(--surface-card) text-(--ink) focus:outline-hidden focus:ring-1 focus:ring-(--brand) mb-1.5"
            />

            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedVariant("");
              }}
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-(--surface-card) text-(--ink) focus:outline-hidden focus:ring-2 focus:ring-(--brand) ${
                formErrors.productId ? "border-rose-500" : "border-(--border)"
              }`}
            >
              <option value="">-- Choose a product --</option>
              {availableProducts.map((p) => {
                const effectivePrice = p.discountPrice || p.price;
                return (
                  <option key={p._id} value={p._id}>
                    {p.name} · ₹{Number(effectivePrice).toLocaleString("en-IN")} ({p.stock ?? 0} in stock)
                  </option>
                );
              })}
            </select>
            {formErrors.productId && (
              <p className="text-[11px] text-rose-500">{formErrors.productId}</p>
            )}
          </div>

          {/* Color Variant Selection (if product has variants) */}
          {selectedProductObj?.variants && selectedProductObj.variants.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-(--ink)">
                Select Color Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-(--border) bg-(--surface-card) text-(--ink) focus:outline-hidden focus:ring-2 focus:ring-(--brand)"
              >
                <option value="">Standard / Default</option>
                {selectedProductObj.variants.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-(--ink) flex items-center justify-between">
              <span>Quantity to Add *</span>
              {selectedProductObj && (
                <span className="text-[11px] text-(--ink-muted)">
                  Available stock: {selectedProductObj.stock ?? 0}
                </span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-xl border border-(--border) bg-(--surface-card) shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-sm font-bold text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken) rounded-l-xl transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedProductObj?.stock || 99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-14 text-center text-xs font-bold text-(--ink) bg-transparent focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      selectedProductObj ? Math.min(selectedProductObj.stock, q + 1) : q + 1,
                    )
                  }
                  className="px-3 py-2 text-sm font-bold text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken) rounded-r-xl transition-colors"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-(--ink-muted)">
                Line Total: <b>{formatCurrency(lineTotalPreview)}</b>
              </span>
            </div>
            {formErrors.quantity && (
              <p className="text-[11px] text-rose-500">{formErrors.quantity}</p>
            )}
          </div>

          {/* Tip / Note Banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-900/40 rounded-xl text-[11.5px] text-blue-800 dark:text-blue-300">
            💡 <b>Helpful Tip:</b> Adding an item here immediately updates the customer's live cart on the storefront. When the customer opens checkout or their cart page, these items will be ready for payment.
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default AdminCartPage;

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllWishlists, adminAddToWishlist } from "../features/wishlist/wishlistSlice";
import { fetchUsers } from "../features/users/usersSlice";
import { fetchProducts } from "../features/products/productsSlice";
import { exportAllWishlistsToExcel } from "../utils/exportProductToExcel";
import { notifyInfo, notifySuccess, notifyError } from "../lib/toast";

import WishlistTable from "../components/wishlist/WishlistTable";
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
  HeartIcon,
  BagIcon,
  InfoIcon,
  XIcon,
  PlusIcon,
  UserIcon,
} from "../components/common/Icon";

/** Check if item was added in last 30 days */
const isRecent = (date) => {
  if (!date) return false;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 30 * 24 * 60 * 60 * 1000;
};

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { wishlists, totalEntries, loading, error } = useSelector(
    (state) => state.wishlist,
  );
  const { users } = useSelector((state) => state.users);
  const { products } = useSelector((state) => state.products);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'popular' | 'sale' | 'recent'
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("niya_wishlist_guide_dismissed") !== "true";
  });

  // Add to Wishlist Drawer State
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAllWishlists());
  }, [dispatch]);

  // Fetch users and products when Drawer opens if not already loaded
  useEffect(() => {
    if (isAddDrawerOpen) {
      if (!users || users.length === 0) dispatch(fetchUsers());
      if (!products || products.length === 0) dispatch(fetchProducts());
    }
  }, [isAddDrawerOpen, dispatch, users, products]);

  /** Aggregate demand insights, product tallies, and pipeline revenue. */
  const insights = useMemo(() => {
    const customers = new Set();
    const productTally = {};
    let totalPotentialValue = 0;
    let discountedCount = 0;
    let recentCount = 0;

    (wishlists || []).forEach((w) => {
      if (w.userEmail || w.userName) customers.add(w.userEmail || w.userName);
      const name = w.productName;
      if (name) productTally[name] = (productTally[name] || 0) + 1;

      const effectivePrice = Number(w.productDiscountPrice || w.productPrice || 0);
      totalPotentialValue += effectivePrice;

      if (w.productDiscountPrice && w.productDiscountPrice < w.productPrice) {
        discountedCount += 1;
      }

      if (isRecent(w.addedAt)) {
        recentCount += 1;
      }
    });

    const top = Object.entries(productTally).sort((a, b) => b[1] - a[1])[0];

    // Multi-saved items (wishlisted by 2 or more shoppers)
    const multiSavedCount = (wishlists || []).filter(
      (w) => (productTally[w.productName] || 0) >= 2,
    ).length;

    return {
      customers: customers.size,
      top: top ? { name: top[0], count: top[1] } : null,
      totalPotentialValue,
      productTally,
      discountedCount,
      multiSavedCount,
      recentCount,
    };
  }, [wishlists]);

  // Filtering by search and activeTab
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (wishlists || []).filter((item) => {
      // Tab filter
      if (activeTab === "popular") {
        if ((insights.productTally[item.productName] || 0) < 2) return false;
      } else if (activeTab === "sale") {
        if (!item.productDiscountPrice || item.productDiscountPrice >= item.productPrice) {
          return false;
        }
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
        String(item.productId || "").toLowerCase().includes(q) ||
        String(item.userId || "").toLowerCase().includes(q)
      );
    });
  }, [wishlists, search, activeTab, insights.productTally]);

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

  const handleExportAll = () => {
    if (!wishlists.length) {
      notifyInfo("Nothing to export", "No products saved yet.");
      return;
    }
    exportAllWishlistsToExcel(wishlists);
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("niya_wishlist_guide_dismissed", "true");
  };

  const handleOpenAddDrawer = () => {
    setSelectedUserId("");
    setSelectedProductId("");
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

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setAdding(true);
    setFormErrors({});

    try {
      await dispatch(
        adminAddToWishlist({
          userId: selectedUserId,
          productId: selectedProductId,
        }),
      ).unwrap();

      notifySuccess(
        "Product added to wishlist!",
        `Saved "${selectedProductObj?.name}" for ${selectedCustomerObj?.name}`,
      );

      handleCloseAddDrawer();
    } catch (err) {
      notifyError("Failed to save product", String(err));
      setFormErrors({ general: String(err) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Wishlists"
        subtitle="Products shoppers saved for later — buying intent & conversion signals."
        meta={
          <>
            <span className="meta-chip meta-chip-brand">
              <HeartIcon className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <b>{totalEntries ?? wishlists.length}</b> saved items
            </span>
            <span className="meta-chip">
              <b>{insights.customers}</b> shoppers
            </span>
            {insights.totalPotentialValue > 0 && (
              <span className="meta-chip font-medium text-emerald-700 dark:text-emerald-400">
                ₹{insights.totalPotentialValue.toLocaleString("en-IN")} pipeline value
              </span>
            )}
            {insights.top && (
              <span className="meta-chip meta-chip-success">
                Top saved: <b>{insights.top.name}</b> ({insights.top.count})
              </span>
            )}
          </>
        }
        actions={
          <>
            <button
              onClick={() => dispatch(fetchAllWishlists())}
              className="btn btn-secondary"
              title="Refresh wishlists"
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
            <button
              onClick={handleOpenAddDrawer}
              className="btn btn-primary"
              title="Save item for a customer"
            >
              <PlusIcon className="w-4 h-4" />
              Add to Wishlist
            </button>
          </>
        }
      />

      {/* 5-10 Second Admin Buying Intent Guide Banner */}
      {showGuide && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-linear-to-r from-rose-50/90 via-pink-50/70 to-slate-50/80 dark:from-rose-950/40 dark:via-pink-950/20 dark:to-slate-900/40 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-950 dark:text-rose-200">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <InfoIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight">
                  Wishlist Insights & Demand Guide
                </h3>
                <p className="text-[11.5px] text-rose-700/80 dark:text-rose-300/80 font-normal">
                  Understand shopper interest, pipeline revenue, and convert interest into orders:
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-rose-100 dark:border-rose-900/40 text-[12px]">
            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-100/60 dark:border-rose-900/30">
              <span className="text-base leading-none">💖</span>
              <div>
                <span className="font-semibold text-(--ink) block">Buying Intent</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Live feed of products shoppers saved to buy later on your storefront.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-100/60 dark:border-rose-900/30">
              <span className="text-base leading-none">💰</span>
              <div>
                <span className="font-semibold text-(--ink) block">Pipeline Revenue</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Total monetary worth of wishlisted products waiting to be purchased.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-100/60 dark:border-rose-900/30">
              <span className="text-base leading-none">💬</span>
              <div>
                <span className="font-semibold text-(--ink) block">1-Click Convert</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Reach out via WhatsApp or Email with special offers on their saved bag.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-100/60 dark:border-rose-900/30">
              <span className="text-base leading-none">📦</span>
              <div>
                <span className="font-semibold text-(--ink) block">Stock Signals</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Items with high wishlist counts should be kept in stock to prevent stockouts.
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
              <span>All Saved Items</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "all"
                    ? "bg-white/25 text-white"
                    : "bg-(--surface-sunken) text-(--ink-muted)"
                }`}
              >
                {wishlists.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("popular")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "popular"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>🔥 High Demand</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "popular"
                    ? "bg-white/25 text-white"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                }`}
              >
                {insights.multiSavedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sale")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "sale"
                  ? "bg-(--brand) text-white shadow-xs"
                  : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
              }`}
            >
              <span>🏷️ On Sale</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "sale"
                    ? "bg-white/25 text-white"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                }`}
              >
                {insights.discountedCount}
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
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
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
              Show Demand Guide
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

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchAllWishlists())}
      />

      {loading && wishlists.length === 0 ? (
        <TableSkeleton rows={6} columns={5} hasThumb />
      ) : (
        <WishlistTable
          wishlists={filtered}
          productTally={insights.productTally}
        />
      )}

      {/* Slide-out Drawer: Add Product to Customer's Wishlist */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={handleCloseAddDrawer}
        title="Add to Customer's Wishlist"
        subtitle="Save an item for a registered shopper (phone or WhatsApp inquiry)"
        icon={<HeartIcon className="w-5 h-5 text-rose-500 fill-rose-500/20" />}
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
              {adding ? "Saving Item..." : "Save to Wishlist"}
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

          {/* Live Preview Card */}
          {(selectedCustomerObj || selectedProductObj) && (
            <div className="p-3.5 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-linear-to-br from-rose-50/50 via-pink-50/30 to-slate-50 dark:from-rose-950/30 dark:via-pink-950/10 dark:to-slate-900/50 shadow-2xs">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-2">
                Live Wishlist Preview
              </span>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                {/* Customer Pill */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center shrink-0">
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

                {/* Arrow */}
                <span className="text-(--ink-muted) font-mono">saves ➜</span>

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
                    <p className="font-semibold text-(--ink) max-w-40 truncate">
                      {selectedProductObj?.name || "Select a product..."}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      {selectedProductObj
                        ? formatCurrency(
                            selectedProductObj.discountPrice || selectedProductObj.price,
                          )
                        : "—"}
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
              <span>Select Product to Save *</span>
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
              onChange={(e) => setSelectedProductId(e.target.value)}
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

          {/* Tip / Note Banner */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-xl text-[11.5px] text-amber-800 dark:text-amber-300">
            💡 <b>Helpful Tip:</b> Saving an item here immediately reflects in the customer's storefront account under their Saved Wishlist items, enabling them to complete checkout anytime.
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default WishlistPage;

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  LayoutGrid,
  Grid3x3,
  Rows3,
  SearchX,
  ArrowUpDown,
  ArrowRight,
  Tag,
} from "lucide-react";
import { api } from "../lib/api";
import { cn, pluralize, getVariantColor, formatCurrency } from "../lib/utils";
import usePageTitle from "../hooks/usePageTitle";
import ProductCard from "../components/product/ProductCard";
import QuickViewModal from "../components/product/QuickViewModal";
import ProductCardSkeleton from "../components/product/ProductCardSkeleton";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ImageWithFallback from "../components/common/ImageWithFallback";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PAGE_LIMIT = 12;
const PRICE_MAX = 10000;
const PRICE_STEP = 250;
const VIEW_STORAGE_KEY = "niya:shop-view";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", sort: "createdAt", order: "desc" },
  { value: "price_asc", label: "Price: low to high", sort: "price", order: "asc" },
  { value: "price_desc", label: "Price: high to low", sort: "price", order: "desc" },
  { value: "rating", label: "Top rated", sort: "averageRating", order: "desc" },
  { value: "name_asc", label: "Name A–Z", sort: "name", order: "asc" },
];

const GENDER_OPTIONS = [
  { value: "All", label: "Everyone" },
  { value: "Women", label: "Women" },
  { value: "Men", label: "Men" },
];

const VIEW_OPTIONS = [
  { value: "grid", label: "Three-column grid", icon: LayoutGrid },
  { value: "compact", label: "Compact four-column grid", icon: Grid3x3 },
  { value: "list", label: "List view", icon: Rows3 },
];

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parentIdOf(category) {
  const p = category?.parentId;
  if (!p) return null;
  return typeof p === "object" ? String(p._id || "") || null : String(p);
}

/** Build a 3-level tree (level 0 → children → grandchildren) ordered by sortOrder, then name. */
function buildCategoryTree(categories) {
  const list = [...categories].sort(
    (a, b) =>
      (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""))
  );
  const ids = new Set(list.map((c) => String(c._id)));
  const byParent = new Map();
  list.forEach((c) => {
    const parent = parentIdOf(c);
    const key = parent && ids.has(parent) ? parent : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  });
  const build = (parent, depth) =>
    (byParent.get(parent) || []).map((c) => ({
      ...c,
      depth,
      children: depth < 2 ? build(String(c._id), depth + 1) : [],
    }));
  return build(null, 0);
}

function flattenTree(tree) {
  const out = [];
  const walk = (nodes) =>
    nodes.forEach((n) => {
      out.push(n);
      walk(n.children);
    });
  walk(tree);
  return out;
}

/** Banner CTA links are admin-entered; make the common shapes actually resolve. */
function resolveBannerLink(linkUrl, categories) {
  if (!linkUrl) return "/shop";
  const raw = String(linkUrl).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  let url = raw.startsWith("/") ? raw : `/${raw}`;
  url = url.replace(/^\/products(?=\?|$)/, "/shop");
  const [path, qs] = url.split("?");
  if (!qs) return url;
  const params = new URLSearchParams(qs);
  const cat = params.get("categoryId");
  if (cat && !OBJECT_ID_RE.test(cat)) {
    const match = categories.find(
      (c) => c.slug === cat || String(c.name).toLowerCase() === cat.toLowerCase()
    );
    if (match) params.set("categoryId", match._id);
    else params.delete("categoryId");
  }
  const s = params.toString();
  return s ? `${path}?${s}` : path;
}

function readStoredView() {
  try {
    const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return VIEW_OPTIONS.some((o) => o.value === v) ? v : "grid";
  } catch {
    return "grid";
  }
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Page-local subcomponents                                            */
/* ------------------------------------------------------------------ */

function ShopFilterGroup({ id, title, count = 0, onReset, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `shop-filter-${id}`;
  return (
    <div className="border-b border-line last:border-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-lg text-left text-small font-semibold text-foreground transition-colors hover:text-gold-ink"
        >
          <span className="flex items-center gap-2">
            {title}
            {count > 0 && (
              <span className="pill pill-gold" aria-label={`${count} selected`}>
                {count}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-gold-ink transition-transform duration-300 ease-luxury",
              open && "rotate-180"
            )}
          />
        </button>
        {count > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-10 rounded-lg px-2 text-micro text-gold-ink transition-colors hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-luxury",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div id={panelId} inert={!open} aria-hidden={!open} className="min-h-0 overflow-hidden">
          <div className="pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CategoryNode({ node, selectedId, onSelect }) {
  const selected = String(node._id) === String(selectedId);
  const isRoot = node.depth === 0;
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(selected ? null : node._id)}
        style={{ paddingLeft: `${0.75 + node.depth * 0.9}rem` }}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-xl pr-3 text-left text-small transition-colors",
          selected
            ? "bg-primary font-semibold text-primary-foreground"
            : isRoot
              ? "font-medium text-foreground hover:bg-surface-2"
              : "text-ink-muted hover:bg-surface-2 hover:text-foreground"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {!isRoot && (
            <span
              aria-hidden="true"
              className={cn(
                "inline-block h-px w-3 shrink-0",
                selected ? "bg-primary-foreground/60" : "bg-line-strong"
              )}
            />
          )}
          <span className="truncate">{node.name}</span>
        </span>
        {selected && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
      </button>
      {node.children.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <CategoryNode key={child._id} node={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ShopFilters({
  idPrefix,
  categoryTree,
  categoryIdParam,
  genderParam,
  collections,
  collectionsParam,
  availableColors,
  colorParam,
  minPriceInput,
  maxPriceInput,
  onMinPriceChange,
  onMaxPriceChange,
  onSliderChange,
  onSliderCommit,
  onApplyPrice,
  onClearPrice,
  hasPriceFilter,
  inStockParam,
  onSaleParam,
  updateFilter,
  hasActiveFilters,
  onClearAll,
}) {
  const sliderValue = useMemo(() => {
    const min = Number(minPriceInput);
    const max = maxPriceInput === "" ? PRICE_MAX : Number(maxPriceInput);
    const safeMin = Number.isFinite(min) ? Math.min(Math.max(min, 0), PRICE_MAX) : 0;
    const safeMax = Number.isFinite(max) ? Math.min(Math.max(max, 0), PRICE_MAX) : PRICE_MAX;
    return [Math.min(safeMin, safeMax), Math.max(safeMin, safeMax)];
  }, [minPriceInput, maxPriceInput]);

  const minId = `${idPrefix}-min-price`;
  const maxId = `${idPrefix}-max-price`;
  const availabilityCount = (inStockParam ? 1 : 0) + (onSaleParam ? 1 : 0);

  return (
    <div className="text-small">
      {categoryTree.length > 0 && (
        <ShopFilterGroup
          id={`${idPrefix}-category`}
          title="Category"
          count={categoryIdParam ? 1 : 0}
          onReset={() => updateFilter("categoryId", null)}
        >
          <ul className="space-y-0.5" aria-label="Categories">
            {categoryTree.map((node) => (
              <CategoryNode
                key={node._id}
                node={node}
                selectedId={categoryIdParam}
                onSelect={(id) => updateFilter("categoryId", id)}
              />
            ))}
          </ul>
        </ShopFilterGroup>
      )}

      <ShopFilterGroup
        id={`${idPrefix}-audience`}
        title="Audience"
        count={genderParam && genderParam !== "All" ? 1 : 0}
        onReset={() => updateFilter("gender", null)}
      >
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Audience">
          {GENDER_OPTIONS.map((g) => {
            const selected = (genderParam || "All") === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={selected}
                onClick={() => updateFilter("gender", g.value === "All" ? null : g.value)}
                className={cn("chip h-10 justify-center px-2", selected && "chip-active")}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </ShopFilterGroup>

      {collections.length > 0 && (
        <ShopFilterGroup
          id={`${idPrefix}-collections`}
          title="Collections"
          count={collectionsParam ? 1 : 0}
          onReset={() => updateFilter("collections", null)}
        >
          <ul className="space-y-0.5" aria-label="Collections">
            {collections.map((col) => {
              const selected = collectionsParam === col._id;
              return (
                <li key={col._id}>
                  <label
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-2 transition-colors hover:bg-surface-2",
                      selected ? "font-semibold text-foreground" : "text-ink-muted"
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(v) => updateFilter("collections", v ? col._id : null)}
                      aria-label={col.name}
                      className="size-4.5 rounded-[5px] border-line-strong"
                    />
                    <span className="truncate">{col.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </ShopFilterGroup>
      )}

      <ShopFilterGroup
        id={`${idPrefix}-price`}
        title="Price"
        count={hasPriceFilter ? 1 : 0}
        onReset={onClearPrice}
      >
        <div className="space-y-4 px-1 pt-2">
          <div role="group" aria-label="Price range">
            <Slider
              value={sliderValue}
              min={0}
              max={PRICE_MAX}
              step={PRICE_STEP}
              minStepsBetweenThumbs={1}
              onValueChange={onSliderChange}
              onValueCommit={onSliderCommit}
              className="[&_[data-slot=slider-range]]:bg-none [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-primary [&_[data-slot=slider-thumb]]:bg-surface [&_[data-slot=slider-thumb]]:ring-ring/40 [&_[data-slot=slider-track]]:bg-line"
            />
          </div>
          <p className="flex items-center justify-between text-micro text-ink-soft" aria-live="polite">
            <span>{formatCurrency(sliderValue[0])}</span>
            <span>
              {sliderValue[1] >= PRICE_MAX ? `${formatCurrency(PRICE_MAX)}+` : formatCurrency(sliderValue[1])}
            </span>
          </p>
          <form onSubmit={onApplyPrice} className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div>
              <label htmlFor={minId} className="label-luxury mb-1.5">
                Min
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-small text-ink-soft"
                >
                  ₹
                </span>
                <input
                  id={minId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={PRICE_MAX}
                  step={50}
                  placeholder="0"
                  value={minPriceInput}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  className="input-luxury h-10 pl-7 pr-2 text-small [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
            <span aria-hidden="true" className="pb-3 text-ink-soft">
              –
            </span>
            <div>
              <label htmlFor={maxId} className="label-luxury mb-1.5">
                Max
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-small text-ink-soft"
                >
                  ₹
                </span>
                <input
                  id={maxId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  placeholder="Any"
                  value={maxPriceInput}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  className="input-luxury h-10 pl-7 pr-2 text-small [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm col-span-3 mt-1">
              Apply price
            </button>
          </form>
        </div>
      </ShopFilterGroup>

      {availableColors.length > 0 && (
        <ShopFilterGroup
          id={`${idPrefix}-colour`}
          title="Colour"
          count={colorParam ? 1 : 0}
          onReset={() => updateFilter("color", null)}
        >
          <ul className="flex flex-wrap gap-2" aria-label="Colours">
            {availableColors.map((name) => {
              const selected = colorParam === name;
              const swatch = getVariantColor({ name });
              return (
                <li key={name}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateFilter("color", selected ? null : name)}
                    className={cn(
                      "chip h-10 gap-2 pl-1.5 pr-3 text-xs font-medium tracking-normal",
                      selected && "chip-active"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-6 shrink-0 rounded-full border border-line-strong shadow-inner",
                        selected && "ring-2 ring-primary-foreground/70"
                      )}
                      style={{ backgroundColor: swatch }}
                    />
                    <span>{name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ShopFilterGroup>
      )}

      <ShopFilterGroup
        id={`${idPrefix}-availability`}
        title="Availability"
        count={availabilityCount}
        onReset={() => updateFilter({ inStock: null, onSale: null })}
      >
        <div className="space-y-0.5">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-foreground transition-colors hover:bg-surface-2">
            <Checkbox
              checked={inStockParam}
              onCheckedChange={(v) => updateFilter("inStock", v ? true : null)}
              className="size-4.5 rounded-[5px] border-line-strong"
            />
            <span>In stock only</span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-foreground transition-colors hover:bg-surface-2">
            <Checkbox
              checked={onSaleParam}
              onCheckedChange={(v) => updateFilter("onSale", v ? true : null)}
              className="size-4.5 rounded-[5px] border-line-strong"
            />
            <span>On sale only</span>
          </label>
        </div>
      </ShopFilterGroup>

      <div className="pt-4">
        <button
          type="button"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
          className="btn btn-ghost btn-sm btn-block disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw aria-hidden="true" />
          <span>Reset filters</span>
        </button>
      </div>
    </div>
  );
}

function ShopBannerStrip({ banner, to, eyebrow = "Featured", className }) {
  const external = /^https?:\/\//i.test(to);
  const Comp = external ? "a" : Link;
  const linkProps = external ? { href: to, target: "_blank", rel: "noopener noreferrer" } : { to };
  return (
    <Comp
      {...linkProps}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-line shadow-soft transition-shadow duration-500 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className
      )}
    >
      <div className="relative aspect-16/9 max-h-72 w-full bg-surface-2 sm:aspect-21/9">
        <ImageWithFallback
          src={banner.image}
          alt=""
          fill
          imgClassName="transition-transform duration-700 ease-luxury group-hover:scale-105"
        />
        <div className="overlay-photo absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8">
          <span className="text-micro text-champagne">{eyebrow}</span>
          <h2 className="mt-1 max-w-xl font-serif text-lg leading-tight text-ivory sm:text-3xl">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-1.5 hidden max-w-lg text-small text-ivory/75 line-clamp-2 sm:block">
              {banner.subtitle}
            </p>
          )}
          <span className="btn btn-ivory btn-sm mt-3 w-fit sm:mt-4">
            <span>Explore</span>
            <ArrowRight aria-hidden="true" />
          </span>
        </div>
      </div>
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [banners, setBanners] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: PAGE_LIMIT,
  });
  const [loading, setLoading] = useState(true);
  const [resultsVersion, setResultsVersion] = useState(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState(readStoredView); // "grid" (3-col) | "compact" (4-col) | "list"

  // Quick View Modal state
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const gridRef = useRef(null);
  const scrollOnNextPageRef = useRef(false);
  const requestRef = useRef(0);

  // Read URL query params
  const categoryIdParam = searchParams.get("categoryId") || "";
  const genderParam = searchParams.get("gender") || "All";
  const collectionsParam = searchParams.get("collections") || "";
  const onSaleParam = searchParams.get("onSale") === "true";
  const inStockParam = searchParams.get("inStock") === "true";
  const colorParam = searchParams.get("color") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const searchParam = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "createdAt";
  const orderParam = searchParams.get("order") || "desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Local price input state
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Fetch categories & collections on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          api.get("/categories").catch(() => ({ data: { categories: [] } })),
          api.get("/collections").catch(() => ({ data: { collections: [] } })),
        ]);
        setCategories(catRes.data?.categories || []);
        setCollections(colRes.data?.collections || []);
      } catch (err) {
        console.error("Failed to load shop filter metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Optional editorial banners for the shop page (silently ignored on failure)
  useEffect(() => {
    let cancelled = false;
    api
      .get("/banners", { params: { page: "shop" } })
      .then((res) => {
        if (!cancelled) setBanners(Array.isArray(res.data?.banners) ? res.data.banners : []);
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the price inputs in step with the URL (covers back/forward navigation)
  // using the "adjust state when a prop changes" pattern instead of an effect.
  const priceParamKey = `${minPriceParam}|${maxPriceParam}`;
  const [syncedPriceKey, setSyncedPriceKey] = useState(priceParamKey);
  if (syncedPriceKey !== priceParamKey) {
    setSyncedPriceKey(priceParamKey);
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }

  // Persist the chosen layout
  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    } catch {
      /* storage unavailable */
    }
  }, [viewMode]);

  // Fetch products whenever params change
  useEffect(() => {
    const requestId = ++requestRef.current;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {
          page: pageParam,
          limit: PAGE_LIMIT,
          sort: sortParam,
          order: orderParam,
          isActive: "true",
        };

        if (categoryIdParam) params.categoryId = categoryIdParam;
        if (genderParam && genderParam !== "All") params.gender = genderParam;
        if (collectionsParam) params.collections = collectionsParam;
        if (onSaleParam) params.onSale = "true";
        if (inStockParam) params.inStock = "true";
        if (colorParam) params.color = colorParam;
        if (minPriceParam) params.minPrice = minPriceParam;
        if (maxPriceParam) params.maxPrice = maxPriceParam;
        if (searchParam) params.search = searchParam;

        const res = await api.get("/products", { params });
        if (requestId !== requestRef.current) return; // stale response
        setProducts(res.data?.products || []);
        if (res.data?.pagination) {
          setPagination(res.data.pagination);
        }
        if (res.data?.availableColors) {
          setAvailableColors(res.data.availableColors);
        }
        setResultsVersion((v) => v + 1);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    };

    fetchProducts();
  }, [
    categoryIdParam,
    genderParam,
    collectionsParam,
    onSaleParam,
    inStockParam,
    colorParam,
    minPriceParam,
    maxPriceParam,
    searchParam,
    sortParam,
    orderParam,
    pageParam,
  ]);

  // After a page change, bring the top of the results into view
  useEffect(() => {
    if (!scrollOnNextPageRef.current) return;
    scrollOnNextPageRef.current = false;
    gridRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [pageParam]);

  /* ---------------- URL helpers ---------------- */

  const updateFilters = useCallback(
    (changes) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          value === false ||
          value === "All"
        ) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      });
      nextParams.set("page", "1"); // Reset to page 1
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /** updateFilter("gender", "Women") or updateFilter({ minPrice: null, maxPrice: null }) */
  const updateFilter = useCallback(
    (key, value) => {
      if (key && typeof key === "object") updateFilters(key);
      else updateFilters({ [key]: value });
    },
    [updateFilters]
  );

  const setPriceRangePreset = (min, max) => {
    updateFilters({
      minPrice: min !== null && min !== undefined ? String(min) : null,
      maxPrice: max !== null && max !== undefined ? String(max) : null,
    });
  };

  const handleApplyPrice = (e) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPriceInput ? minPriceInput : null,
      maxPrice: maxPriceInput ? maxPriceInput : null,
    });
  };

  const handleSliderChange = ([min, max]) => {
    setMinPriceInput(min === 0 ? "" : String(min));
    setMaxPriceInput(max >= PRICE_MAX ? "" : String(max));
  };

  const handleSliderCommit = ([min, max]) => {
    setPriceRangePreset(min === 0 ? null : min, max >= PRICE_MAX ? null : max);
  };

  const clearPrice = () => updateFilters({ minPrice: null, maxPrice: null });

  const handleSortChange = (val) => {
    const option = SORT_OPTIONS.find((o) => o.value === val);
    if (!option) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", option.sort);
    nextParams.set("order", option.order);
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const currentSortKey = useMemo(() => {
    const match = SORT_OPTIONS.find((o) => o.sort === sortParam && o.order === orderParam);
    if (match) return match.value;
    if (sortParam === "averageRating") return "rating";
    return "newest";
  }, [sortParam, orderParam]);

  const goToPage = (page) => {
    const target = Math.min(Math.max(1, page), pagination.totalPages || 1);
    if (target === pagination.currentPage) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(target));
    scrollOnNextPageRef.current = true;
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setMinPriceInput("");
    setMaxPriceInput("");
  };

  const handleOpenQuickView = (product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  /* ---------------- Derived data ---------------- */

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree]);
  const activeCategory = categories.find((c) => String(c._id) === categoryIdParam);
  const activeCollection = collections.find((c) => String(c._id) === collectionsParam);
  const hasPriceFilter = Boolean(minPriceParam || maxPriceParam);

  const priceLabel = useMemo(() => {
    if (minPriceParam && maxPriceParam)
      return `${formatCurrency(minPriceParam)} – ${formatCurrency(maxPriceParam)}`;
    if (minPriceParam) return `From ${formatCurrency(minPriceParam)}`;
    if (maxPriceParam) return `Up to ${formatCurrency(maxPriceParam)}`;
    return "";
  }, [minPriceParam, maxPriceParam]);

  const activeFilters = [];
  if (searchParam)
    activeFilters.push({ key: "search", label: `“${searchParam}”`, remove: () => updateFilter("search", null) });
  if (genderParam && genderParam !== "All")
    activeFilters.push({ key: "gender", label: genderParam, remove: () => updateFilter("gender", null) });
  if (categoryIdParam)
    activeFilters.push({
      key: "categoryId",
      label: activeCategory?.name || "Category",
      remove: () => updateFilter("categoryId", null),
    });
  if (collectionsParam)
    activeFilters.push({
      key: "collections",
      label: activeCollection?.name || "Collection",
      remove: () => updateFilter("collections", null),
    });
  if (colorParam)
    activeFilters.push({ key: "color", label: colorParam, remove: () => updateFilter("color", null) });
  if (hasPriceFilter) activeFilters.push({ key: "price", label: priceLabel, remove: clearPrice });
  if (inStockParam)
    activeFilters.push({ key: "inStock", label: "In stock", remove: () => updateFilter("inStock", null) });
  if (onSaleParam)
    activeFilters.push({ key: "onSale", label: "On sale", remove: () => updateFilter("onSale", null) });
  const hasActiveFilters = activeFilters.length > 0;

  const pageTitle = activeCategory
    ? activeCategory.name
    : genderParam === "Women"
      ? "Women's atelier"
      : genderParam === "Men"
        ? "Men's collection"
        : activeCollection
          ? activeCollection.name
          : searchParam
            ? `Results for “${searchParam}”`
            : "All bags";

  usePageTitle(pageTitle);

  const totalProducts = Number(pagination.totalProducts) || 0;
  const countLabel = loading && products.length === 0
    ? "Curating pieces…"
    : `Showing ${products.length} of ${pluralize(totalProducts, "piece")}`;

  const breadcrumbs = activeCategory
    ? [{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, { label: activeCategory.name }]
    : [{ label: "Home", to: "/" }, { label: "Shop" }];

  const afterHeroBanner = banners.find((b) => b?.position === "after-hero" && b?.image);
  const afterProductsBanner = banners.find((b) => b?.position === "after-products" && b?.image);

  const isListView = viewMode === "list";
  const gridClass = isListView
    ? "grid grid-cols-1 gap-4"
    : cn(
        "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3",
        viewMode === "compact" && "xl:grid-cols-4"
      );
  const skeletonCount = isListView ? 6 : PAGE_LIMIT;
  const showSkeletons = loading && products.length === 0;

  const filterProps = {
    categoryTree,
    categoryIdParam,
    genderParam,
    collections,
    collectionsParam,
    availableColors,
    colorParam,
    minPriceInput,
    maxPriceInput,
    onMinPriceChange: setMinPriceInput,
    onMaxPriceChange: setMaxPriceInput,
    onSliderChange: handleSliderChange,
    onSliderCommit: handleSliderCommit,
    onApplyPrice: handleApplyPrice,
    onClearPrice: clearPrice,
    hasPriceFilter,
    inStockParam,
    onSaleParam,
    updateFilter,
    hasActiveFilters,
    onClearAll: clearAllFilters,
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="container-x page-top pb-16 sm:pb-24">
      <PageHeader
        eyebrow="Atelier catalogue"
        breadcrumbs={breadcrumbs}
        title={pageTitle}
        description={countLabel}
        size="compact"
        className="mb-6 sm:mb-8"
      />

      {afterHeroBanner && (
        <ShopBannerStrip
          banner={afterHeroBanner}
          to={resolveBannerLink(afterHeroBanner.linkUrl, categories)}
          className="mb-6 sm:mb-8"
        />
      )}

      {/* Category chips */}
      <nav aria-label="Browse by category" className="-mx-4 mb-5 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <ul className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:snap-none lg:overflow-visible">
          <li className="shrink-0 snap-start">
            <button
              type="button"
              aria-pressed={!categoryIdParam}
              onClick={() => updateFilter("categoryId", null)}
              className={cn("chip h-10", !categoryIdParam && "chip-active")}
            >
              All pieces
            </button>
          </li>
          {flatCategories.map((cat) => {
            const selected = categoryIdParam === String(cat._id);
            return (
              <li key={cat._id} className="shrink-0 snap-start">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateFilter("categoryId", selected ? null : cat._id)}
                  className={cn("chip h-10", cat.depth > 0 && !selected && "text-ink-muted", selected && "chip-active")}
                >
                  {cat.name}
                </button>
              </li>
            );
          })}
          <li className="shrink-0 snap-start">
            <button
              type="button"
              aria-pressed={onSaleParam}
              onClick={() => updateFilter("onSale", !onSaleParam)}
              className={cn("chip h-10", onSaleParam ? "chip-active" : "text-gold-ink")}
            >
              <Tag className="size-3.5" aria-hidden="true" />
              <span>On sale</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Toolbar */}
      <div className="surface-glass z-30 mb-6 rounded-2xl px-3 py-2 lg:sticky lg:top-24">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="basis-full py-1.5 text-small text-ink-muted sm:mr-auto sm:basis-auto"
            aria-live="polite"
            aria-atomic="true"
          >
            {loading && products.length === 0 ? (
              "Curating pieces…"
            ) : (
              <>
                <span className="font-semibold text-foreground">{products.length}</span> of{" "}
                {pluralize(totalProducts, "piece")}
                {loading && <span className="ml-2 text-ink-soft">· updating…</span>}
              </>
            )}
          </p>

          <button
            type="button"
            aria-label="Open filters"
            aria-haspopup="dialog"
            aria-expanded={isMobileFilterOpen}
            onClick={() => setIsMobileFilterOpen(true)}
            className="btn btn-secondary btn-sm lg:hidden"
          >
            <SlidersHorizontal aria-hidden="true" />
            <span>
              Filters
              {hasActiveFilters ? ` (${activeFilters.length})` : ""}
            </span>
          </button>

          <Select value={currentSortKey} onValueChange={handleSortChange}>
            <SelectTrigger
              aria-label="Sort products"
              className="h-10 min-w-42 grow rounded-xl border-line bg-surface px-3 text-xs font-semibold uppercase tracking-[0.08em] text-foreground shadow-none transition-colors hover:border-line-strong focus-visible:ring-ring/40 data-[size=default]:h-10 sm:grow-0 dark:bg-surface dark:hover:bg-surface-2 [&_svg]:text-gold-ink"
            >
              <ArrowUpDown className="size-3.5" aria-hidden="true" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="end"
              className="rounded-xl border border-line bg-surface p-1 text-foreground shadow-lift ring-0"
            >
              {SORT_OPTIONS.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="rounded-lg py-2 pl-3 pr-9 text-small text-foreground focus:bg-surface-2 focus:text-foreground data-[state=checked]:font-semibold"
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v)}
            aria-label="Layout"
            className="hidden h-11 gap-0.5 rounded-xl border-line bg-surface p-0.5 shadow-none sm:flex"
          >
            {VIEW_OPTIONS.map((o) => (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                aria-label={o.label}
                title={o.label}
                className="size-10 rounded-lg px-0 py-0 text-ink-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none"
              >
                <o.icon className="size-4" aria-hidden="true" />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {hasActiveFilters && (
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line/70 pt-2">
            <span className="text-micro text-ink-soft">Filters</span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={f.remove}
                aria-label={`Remove filter: ${f.label}`}
                className="chip h-9 gap-1.5 pr-2.5 text-xs font-medium tracking-normal"
              >
                <span>{f.label}</span>
                <X className="size-3.5 text-ink-soft" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-1 min-h-9 rounded-lg px-2 text-micro text-gold-ink transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[260px_1fr] xl:gap-12">
        {/* Desktop filter rail */}
        <aside
          aria-label="Filter products"
          className="surface-card hidden max-h-[calc(100vh-11rem)] overflow-y-auto overscroll-contain p-5 lg:sticky lg:top-40 lg:block lg:self-start"
        >
          <div className="mb-2 flex items-center justify-between gap-3 border-b border-line pb-4">
            <h2 className="text-h4 text-foreground">Refine</h2>
            <span className="flex items-center gap-2 text-micro text-ink-soft">
              {hasActiveFilters ? `${activeFilters.length} active` : "All pieces"}
              <SlidersHorizontal className="size-4 text-gold-ink" aria-hidden="true" />
            </span>
          </div>
          <ShopFilters idPrefix="desktop" {...filterProps} />
        </aside>

        {/* Results */}
        <section
          ref={gridRef}
          aria-labelledby="shop-results-heading"
          aria-busy={loading}
          className="min-w-0 scroll-mt-32"
        >
          <h2 id="shop-results-heading" className="sr-only">
            {pageTitle} — results
          </h2>

          {showSkeletons ? (
            <div className={gridClass} role="status" aria-label="Loading pieces">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <ProductCardSkeleton key={i} layout={isListView ? "list" : "grid"} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No pieces match these filters"
              description="Try widening the price range or removing a filter or two — the atelier has more to show."
              action={{ label: "Clear filters", onClick: clearAllFilters }}
              secondaryAction={{ label: "Browse all bags", to: "/shop" }}
            />
          ) : (
            <div
              key={resultsVersion}
              className={cn(
                gridClass,
                "animate-fade-in transition-opacity duration-300 *:min-w-0",
                loading && "pointer-events-none opacity-60"
              )}
            >
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onQuickView={handleOpenQuickView}
                  layout={isListView ? "list" : "grid"}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <Pagination className="mt-10 sm:mt-14" aria-label="Product pages">
              <PaginationContent className="flex-wrap gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    disabled={!pagination.hasPrevPage}
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    className="h-10 min-w-10 rounded-xl border-line bg-surface px-3 text-foreground shadow-none hover:border-line-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
                  />
                </PaginationItem>

                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  const show =
                    pNum === 1 ||
                    pNum === pagination.totalPages ||
                    Math.abs(pNum - pagination.currentPage) <= 1;
                  if (!show) {
                    if (pNum === pagination.currentPage - 2 || pNum === pagination.currentPage + 2) {
                      return (
                        <PaginationItem key={pNum}>
                          <PaginationEllipsis className="size-10 text-ink-soft" />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  const isActive = pNum === pagination.currentPage;
                  return (
                    <PaginationItem key={pNum}>
                      <PaginationButton
                        isActive={isActive}
                        aria-label={`Page ${pNum}`}
                        onClick={() => goToPage(pNum)}
                        className={cn(
                          "h-10 min-w-10 rounded-xl px-3 shadow-none",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-line bg-surface text-foreground hover:border-line-strong hover:bg-surface-2"
                        )}
                      >
                        {pNum}
                      </PaginationButton>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    disabled={!pagination.hasNextPage}
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    className="h-10 min-w-10 rounded-xl border-line bg-surface px-3 text-foreground shadow-none hover:border-line-strong hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {afterProductsBanner && (
            <ShopBannerStrip
              banner={afterProductsBanner}
              to={resolveBannerLink(afterProductsBanner.linkUrl, categories)}
              eyebrow="Discover more"
              className="mt-12 sm:mt-16"
            />
          )}
        </section>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full gap-0 border-line bg-background p-0 text-foreground sm:max-w-md"
        >
          <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <SheetTitle className="text-h4 text-foreground">Refine</SheetTitle>
              <SheetDescription className="text-small text-ink-muted">
                {pluralize(totalProducts, "piece")} match your selection
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <button type="button" className="icon-btn shrink-0" aria-label="Close filters">
                <X className="size-5" aria-hidden="true" />
              </button>
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-2">
            <ShopFilters idPrefix="mobile" {...filterProps} />
          </div>

          <div className="surface-glass flex items-center gap-3 border-t border-line px-5 py-4">
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="btn btn-ghost btn-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="btn btn-primary btn-block"
            >
              Show {pluralize(totalProducts, "piece")}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </div>
  );
}

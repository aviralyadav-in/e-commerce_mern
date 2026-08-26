import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productsSlice";
import ProductCard from "../components/product/ProductCard";
import ShopFilters from "../components/shop/ShopFilters";
import { SpinnerIcon } from "../components/common/Icons";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "numOfReviews:desc", label: "Most Reviewed" },
  { value: "averageRating:desc", label: "Top Rated" },
];

const COLLECTION_TITLES = {
  featured: { eyebrow: "Handpicked For You", title: "Featured" },
  best: { eyebrow: "Most Loved", title: "Bestsellers" },
  new: { eyebrow: "Just In", title: "New Arrivals" },
};

const COLLECTION_DESCRIPTION =
  "Discover the complete Niya Bags collection, thoughtfully designed for every moment.";

export default function ShopPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, pagination, loading } = useSelector((s) => s.products);
  const categories = useSelector((s) => s.categories.categories);

  const categoryParam = searchParams.get("category") || "";
  const categorySlugs = useMemo(
    () => categoryParam.split(",").filter(Boolean),
    [categoryParam],
  );
  const collectionParam = searchParams.get("collection") || "";
  const collectionTags = useMemo(
    () => collectionParam.split(",").filter(Boolean),
    [collectionParam],
  );
  const onSale = searchParams.get("sale") === "1";
  const sort =
    searchParams.get("sort") ||
    (collectionTags.includes("best") ? "numOfReviews:desc" : "createdAt:desc");
  const page = Number(searchParams.get("page") || 1);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Category slugs → IDs (server multi-category filter ke liye)
  const categoryIds = useMemo(() => {
    if (!categorySlugs.length) return "";
    return categories
      .filter((c) => categorySlugs.includes(c.slug))
      .map((c) => c._id)
      .join(",");
  }, [categories, categorySlugs]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  // Sab kuch server-side — category, collection, sale, price, search, pagination
  useEffect(() => {
    const [sortKey, order] = sort.split(":");
    dispatch(
      fetchProducts({
        page,
        limit: 12,
        sort: sortKey,
        order: order || "desc",
        categoryIds: categoryIds || undefined,
        collection: collectionParam || undefined,
        onSale,
        isActive: true,
        search: searchParams.get("search") || undefined,
        minPrice: searchParams.get("minPrice") || undefined,
        maxPrice: searchParams.get("maxPrice") || undefined,
      }),
    );
  }, [
    dispatch,
    searchParams,
    page,
    sort,
    categoryIds,
    collectionParam,
    onSale,
  ]);

  // Heading — Sale > Collection tag > Shop All
  let heading = { eyebrow: "The Collection", title: "Shop All" };
  if (onSale) heading = { eyebrow: "On Discount", title: "Sale" };
  else if (collectionTags.length === 1 && COLLECTION_TITLES[collectionTags[0]])
    heading = COLLECTION_TITLES[collectionTags[0]];

  const total = pagination?.totalProducts ?? products.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Collection header — left title, right description */}
      <div
        className="mb-10 flex flex-col gap-4 pb-8 md:flex-row md:items-end md:justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="eyebrow mb-2">{heading.eyebrow}</p>
          <h1 className="section-title">{heading.title}</h1>
        </div>
        <p
          className="max-w-sm text-sm md:text-right"
          style={{ color: "var(--ink-muted)" }}
        >
          {COLLECTION_DESCRIPTION}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-60">
          <ShopFilters search={search} setSearch={setSearch} />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--ink-muted)" }}
            >
              {loading && !products.length ? "Loading…" : `${total} Products`}
            </p>
            <select
              className="field w-auto! py-2! text-sm"
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>

          {loading && !products.length ? (
            <div className="flex items-center justify-center py-32">
              <SpinnerIcon size={28} style={{ color: "var(--accent)" }} />
            </div>
          ) : products.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <p
                className="font-display text-2xl"
                style={{ color: "var(--ink-muted)" }}
              >
                No products found
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-faint)" }}>
                Try adjusting your filters or search.
              </p>
            </div>
          )}

          {/* Pagination — server-side */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                className="btn btn-outline py-2! text-[11px]!"
                disabled={!pagination.hasPrevPage}
                onClick={() => setParam("page", String(page - 1))}
              >
                Prev
              </button>
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((n) => (
                <button
                  key={n}
                  className={`chip px-3.5! py-1.5! ${n === pagination.currentPage ? "chip-active" : ""}`}
                  onClick={() => setParam("page", String(n))}
                >
                  {n}
                </button>
              ))}
              <button
                className="btn btn-outline py-2! !text-[11px]!"
                disabled={!pagination.hasNextPage}
                onClick={() => setParam("page", String(page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../api/client";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-linear-to-br from-slate-200 to-slate-300" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function FeaturedProductsGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/products", {
          params: {
            page: 1,
            limit: 8,
            sort: "createdAt",
            order: "desc",
          },
        });
        const list = response?.data?.data?.products || [];
        setProducts(list);
      } catch {
        setError("Could not load products right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section id="featured-products" className="mt-10">
      {/* Section Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Featured Collection
          </div>
          <h2 className="text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
            Featured Products
          </h2>
          <p className="mt-1 text-slate-500">
            Handpicked products just for you
          </p>
        </div>
        {!loading && !error && products.length > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-600">
              {products.length} products available
            </span>
          </div>
        )}
      </div>

      {/* Loading State - Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50 py-20 text-center">
          <div className="mb-4 text-5xl">😕</div>
          <h3 className="text-lg font-bold text-slate-800">
            Oops! Something went wrong
          </h3>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <div className="mb-4 text-5xl">🛍️</div>
          <h3 className="text-lg font-bold text-slate-800">
            No Products Found
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Check back later for new arrivals!
          </p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <article
              key={product._id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              {/* Product Image Area */}
              <div className="relative flex h-48 items-center justify-center overflow-hidden bg-linear-to-br from-indigo-950 via-slate-900 to-violet-950">
                {/* Decorative bg */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)]" />

                {/* Product number badge */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl backdrop-blur-sm">
                    🛍️
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                    Product Preview
                  </span>
                </div>

                {/* New badge */}
                <div className="absolute right-3 top-3 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                  New
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-3 p-5">
                {/* Name */}
                <h3 className="line-clamp-1 text-base font-black text-slate-900">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                  {product.description}
                </p>

                {/* Price & Category */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-xl font-black text-slate-900">
                    <span className="text-sm font-semibold text-slate-400">
                      $
                    </span>
                    {product.price}
                  </p>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                    {product.category?.name || "Category"}
                  </span>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className="w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-bold text-white opacity-0 shadow-md shadow-indigo-500/20 transition duration-300 group-hover:opacity-100 hover:from-indigo-500 hover:to-violet-500"
                >
                  Add to Cart 🛒
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default FeaturedProductsGrid;

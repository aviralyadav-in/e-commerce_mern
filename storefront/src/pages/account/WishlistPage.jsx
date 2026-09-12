import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "../../stores/wishlistStore";
import { useCartStore } from "../../stores/cartStore";
import { pluralize } from "../../lib/utils";
import usePageTitle from "../../hooks/usePageTitle";
import EmptyState from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/PageLoader";
import ProductCard from "../../components/product/ProductCard";

function WishlistSkeleton() {
  return (
    <li className="surface-card overflow-hidden" aria-hidden="true">
      <div className="skeleton-shimmer aspect-3/4 w-full" />
      <div className="space-y-2 p-4">
        <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
        <div className="skeleton-shimmer h-4 w-1/4 rounded-full" />
      </div>
    </li>
  );
}

export default function WishlistPage() {
  usePageTitle("Wishlist");
  const products = useWishlistStore((s) => s.products);
  const loading = useWishlistStore((s) => s.loading);
  const getWishlist = useWishlistStore((s) => s.getWishlist);
  const addToCart = useCartStore((s) => s.addToCart);
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    getWishlist();
  }, [getWishlist]);

  const items = products.filter(Boolean);
  const inStockItems = items.filter((p) => Number(p.stock) > 0);
  const showSkeleton = loading && items.length === 0;

  const handleAddAll = async () => {
    if (inStockItems.length === 0 || addingAll) return;
    setAddingAll(true);
    let added = 0;
    for (const product of inStockItems) {
      const res = await addToCart({
        product,
        variantName: product.variants?.[0]?.name || null,
        quantity: 1,
      });
      if (res?.success) added += 1;
    }
    setAddingAll(false);
    if (added > 0) {
      toast.success(`${pluralize(added, "piece")} added to your bag`);
    } else {
      toast.error("Nothing could be added to your bag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Wishlist</h2>
          <p className="mt-1 text-small text-ink-muted" aria-live="polite">
            {showSkeleton
              ? "Fetching your saved pieces…"
              : items.length === 0
                ? "Pieces you save will wait for you here."
                : `${pluralize(items.length, "saved piece")}${
                    inStockItems.length < items.length
                      ? ` · ${pluralize(items.length - inStockItems.length, "piece")} currently sold out`
                      : ""
                  }`}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/shop" className="btn btn-ghost btn-sm">
              <span>Continue shopping</span>
              <ArrowRight aria-hidden="true" />
            </Link>
            {inStockItems.length > 0 && (
              <button
                type="button"
                onClick={handleAddAll}
                disabled={addingAll}
                aria-busy={addingAll || undefined}
                className="btn btn-primary btn-sm"
              >
                {addingAll ? <Spinner className="size-4" /> : <ShoppingBag aria-hidden="true" />}
                <span>{addingAll ? "Adding" : "Add all to bag"}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {showSkeleton ? (
        <ul
          className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Loading wishlist"
        >
          <WishlistSkeleton />
          <WishlistSkeleton />
          <WishlistSkeleton />
          <WishlistSkeleton />
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any piece while you browse and it will be saved here for later."
          action={{ label: "Explore the collection", to: "/shop" }}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-label="Saved products">
          {items.map((product) => (
            <li key={product._id || product.id} className="min-w-0">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

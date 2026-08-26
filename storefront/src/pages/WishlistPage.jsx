import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "../features/wishlist/wishlistSlice";
import { pushToast } from "../features/ui/uiSlice";
import ProductCard from "../components/product/ProductCard";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const products = useSelector((s) => s.wishlist.products);

  const handleRemove = async (productId) => {
    const result = await dispatch(toggleWishlist(productId));
    if (toggleWishlist.fulfilled.match(result)) {
      dispatch(pushToast("Removed from wishlist", "info"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="eyebrow mb-2">Saved Pieces</p>
      <h1 className="section-title mb-8">My Wishlist</h1>

      {!products.length ? (
        <div className="py-20 text-center">
          <p className="font-display text-2xl" style={{ color: "var(--ink-muted)" }}>
            Your wishlist is empty
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-faint)" }}>
            Tap the ♥ on any product to save it here.
          </p>
          <Link to="/shop" className="btn btn-accent mt-8">
            Explore the Collection
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products
              .filter((w) => w.product)
              .map((w) => (
                <ProductCard key={w.product._id} product={w.product} />
              ))}
          </div>
          <div className="mt-8 text-center">
            <button
              className="text-xs font-semibold underline"
              style={{ color: "var(--ink-muted)" }}
              onClick={() => products.forEach((w) => handleRemove(w.product?._id))}
            >
              Clear entire wishlist
            </button>
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../features/cart/cartSlice";
import { toggleWishlist } from "../../features/wishlist/wishlistSlice";
import { pushToast, openCart } from "../../features/ui/uiSlice";
import {
  effectivePrice,
  discountPercent,
  formatCurrency,
  productImage,
  titleCase,
} from "../../utils/format";
import { getAssetUrl } from "../../utils/assetUrl";
import { BagIcon, HeartIcon } from "../common/Icons";

/**
 * Product card — badge, wishlist heart, hover ADD TO BAG,
 * category label, name, price + strikethrough + % OFF.
 */
export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const wishlistIds = useSelector(
    (state) => state.wishlist.products.map((w) => w.product?._id),
  );
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const inWishlist = wishlistIds.includes(product._id);

  const price = effectivePrice(product);
  const off = discountPercent(product);
  const img = productImage(product);
  const categoryName = product.categoryId?.name || "";
  const outOfStock = product.stock <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login?redirect=/");
      dispatch(pushToast("Please login to add items to your bag", "info"));
      return;
    }
    if (outOfStock) return;
    setAdding(true);
    const result = await dispatch(addToCart({ productId: product._id }));
    setAdding(false);
    if (addToCart.fulfilled.match(result)) {
      dispatch(pushToast(`${product.name} added to bag`));
      dispatch(openCart());
    } else {
      dispatch(pushToast(result.payload || "Could not add to bag", "error"));
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login?redirect=/");
      dispatch(pushToast("Please login to save favourites", "info"));
      return;
    }
    const result = await dispatch(toggleWishlist(product._id));
    if (toggleWishlist.fulfilled.match(result)) {
      dispatch(
        pushToast(
          result.payload.action === "added"
            ? "Saved to wishlist"
            : "Removed from wishlist",
          "info",
        ),
      );
    }
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card group block">
      <div className="product-media">
        {img ? (
          <img src={getAssetUrl(img)} alt={product.name} loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl" style={{ color: "var(--ink-faint)" }}>
            NB
          </div>
        )}

        {product.isFeatured ? (
          <span className="badge absolute left-3 top-3">Featured</span>
        ) : product.isNewArrival ? (
          <span className="badge absolute left-3 top-3">New</span>
        ) : off > 0 ? (
          <span className="badge badge-sale absolute left-3 top-3">Sale</span>
        ) : null}

        <button
          className={`wish-btn ${inWishlist ? "active" : ""}`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlist}
        >
          <HeartIcon size={17} filled={inWishlist} />
        </button>

        {!outOfStock && (
          <button className="product-add" onClick={handleAdd} disabled={adding}>
            <BagIcon size={16} />
            {adding ? "Adding…" : "Add to Bag"}
          </button>
        )}
        {outOfStock && (
          <span className="badge absolute bottom-3 left-3" style={{ background: "var(--danger)" }}>
            Out of Stock
          </span>
        )}
      </div>

      <div className="pt-3">
        {categoryName && (
          <p className="eyebrow mb-1" style={{ fontSize: 10 }}>
            {titleCase(categoryName)}
          </p>
        )}
        <h3
          className="truncate text-[15px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {product.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>
            {formatCurrency(price)}
          </span>
          {off > 0 && (
            <>
              <span
                className="text-xs line-through"
                style={{ color: "var(--ink-faint)" }}
              >
                {formatCurrency(product.price)}
              </span>
              <span className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                {off}% OFF
              </span>
            </>
          )}
        </div>
        {product.numOfReviews > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="star text-xs">★</span>
            <span className="text-[11px] font-semibold" style={{ color: "var(--ink-soft)" }}>
              {product.averageRating.toFixed(1)}
            </span>
            <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
              ({product.numOfReviews})
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

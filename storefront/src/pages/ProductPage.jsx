import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductById,
  fetchProducts,
  clearCurrentProduct,
} from "../features/products/productsSlice";
import {
  fetchProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../features/reviews/reviewsSlice";
import { addToCart } from "../features/cart/cartSlice";
import { toggleWishlist } from "../features/wishlist/wishlistSlice";
import { pushToast, openCart } from "../features/ui/uiSlice";
import { getAssetUrl } from "../utils/assetUrl";
import {
  effectivePrice,
  discountPercent,
  formatCurrency,
  formatDate,
  titleCase,
} from "../utils/format";
import QuantityStepper from "../components/common/QuantityStepper";
import RatingStars from "../components/common/RatingStars";
import ProductCard from "../components/product/ProductCard";
import {
  BagIcon,
  HeartIcon,
  SpinnerIcon,
  TruckIcon,
  ShieldIcon,
  RefreshIcon,
  StarIcon,
} from "../components/common/Icons";

export default function ProductPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Review edit/delete ke liye local UI state
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const { current: product, currentLoading } = useSelector((s) => s.products);
  const { items: reviews } = useSelector((s) => s.reviews);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const wishlistIds = useSelector((s) =>
    s.wishlist.products.map((w) => w.product?._id),
  );
  const related = useSelector((s) => s.products.products);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchProductReviews(id));
    // Reset local UI state product change par (async — lint-safe)
    const t = setTimeout(() => {
      setQty(1);
      setActiveImg(0);
    }, 0);
    return () => {
      clearTimeout(t);
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  // Related products — same category ka pool
  useEffect(() => {
    if (product?.categoryId?._id) {
      dispatch(
        fetchProducts({
          categoryId: product.categoryId._id,
          limit: 8,
        }),
      );
    }
  }, [dispatch, product?.categoryId?._id]);

  if (currentLoading || !product) {
    return (
      <div className="flex items-center justify-center py-40">
        <SpinnerIcon size={30} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const images = product.images?.desktop || [];
  const price = effectivePrice(product);
  const off = discountPercent(product);
  const inWishlist = wishlistIds.includes(product._id);
  const relatedList = related.filter((p) => p._id !== product._id).slice(0, 4);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${id}`);
      dispatch(pushToast("Please login to add items to your bag", "info"));
      return;
    }
    setAdding(true);
    const result = await dispatch(
      addToCart({ productId: product._id, quantity: qty }),
    );
    setAdding(false);
    if (addToCart.fulfilled.match(result)) {
      dispatch(pushToast(`${product.name} added to bag`));
      dispatch(openCart());
    } else {
      dispatch(pushToast(result.payload || "Could not add to bag", "error"));
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${id}`);
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

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(
      createReview({ product: product._id, rating, comment }),
    );
    setSubmitting(false);
    if (createReview.fulfilled.match(result)) {
      dispatch(pushToast("Review submitted, thank you!"));
      setComment("");
      // Rating stats refresh
      dispatch(fetchProductById(id));
    } else {
      dispatch(pushToast(result.payload || "Could not submit review", "error"));
    }
  };

  // Apna review edit karna shuru karo
  const startEditReview = (review) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEditReview = () => setEditingId(null);

  // Edited review save karo
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    const result = await dispatch(
      updateReview({ id: editingId, rating: editRating, comment: editComment }),
    );
    setSavingEdit(false);
    if (updateReview.fulfilled.match(result)) {
      dispatch(pushToast("Review updated"));
      setEditingId(null);
      // Average rating refresh
      dispatch(fetchProductById(id));
    } else {
      dispatch(pushToast(result.payload || "Could not update review", "error"));
    }
  };

  // Apna review delete karo (window.confirm se safe guard)
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete your review?")) return;
    const result = await dispatch(deleteReview(reviewId));
    if (deleteReview.fulfilled.match(result)) {
      dispatch(pushToast("Review deleted", "info"));
      // Average rating / count refresh
      dispatch(fetchProductById(id));
    } else {
      dispatch(pushToast(result.payload || "Could not delete review", "error"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs" style={{ color: "var(--ink-muted)" }}>
        <Link to="/" className="hover:text-(--accent)">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link to="/shop" className="hover:text-(--accent)">
          Shop
        </Link>
        {product.categoryId?.name && (
          <>
            <span className="mx-1.5">/</span>
            <span>{product.categoryId.name}</span>
          </>
        )}
        <span className="mx-1.5">/</span>
        <span style={{ color: "var(--ink)" }}>{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="product-media aspect-square!">
            {images.length ? (
              <img
                src={getAssetUrl(images[activeImg] || images[0])}
                alt={product.name}
              />
            ) : (
              <div
                className="flex h-full items-center justify-center font-display text-5xl"
                style={{ color: "var(--ink-faint)" }}
              >
                NB
              </div>
            )}
            {off > 0 && (
              <span className="badge badge-sale absolute left-4 top-4">
                {off}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img}
                  className="h-20 w-16 overflow-hidden rounded-lg"
                  style={{
                    border:
                      i === activeImg
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                    background: "var(--bg-raised)",
                  }}
                  onClick={() => setActiveImg(i)}
                >
                  <img
                    src={getAssetUrl(img)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.categoryId?.name && (
            <p className="eyebrow mb-2">{titleCase(product.categoryId.name)}</p>
          )}
          <h1 className="font-display text-3xl font-medium md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <RatingStars value={product.averageRating} size={16} showValue />
            <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
              ({product.numOfReviews} reviews)
            </span>
            {product.brand && (
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                · {product.brand}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatCurrency(price)}</span>
            {off > 0 && (
              <>
                <span
                  className="text-lg line-through"
                  style={{ color: "var(--ink-faint)" }}
                >
                  {formatCurrency(product.price)}
                </span>
                <span className="font-bold" style={{ color: "var(--accent)" }}>
                  {off}% OFF
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
            {product.stock > 0
              ? product.stock <= 5
                ? `Hurry! Only ${product.stock} left in stock`
                : "In stock & ready to ship"
              : "Out of stock"}
          </p>

          <p
            className="mt-5 whitespace-pre-line text-sm leading-relaxed"
            style={{ color: "var(--ink-soft)" }}
          >
            {product.description}
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={qty}
              onChange={setQty}
              max={Math.max(1, Math.min(product.stock, 10))}
            />
            <button
              className="btn btn-accent flex-1 sm:flex-none sm:px-10"
              onClick={handleAdd}
              disabled={adding || product.stock <= 0}
            >
              <BagIcon size={16} />
              {product.stock <= 0
                ? "Out of Stock"
                : adding
                  ? "Adding…"
                  : "Add to Bag"}
            </button>
            <button
              className="icon-btn h-12! w-12!"
              style={{
                border: "1px solid var(--border-strong)",
                color: inWishlist ? "var(--danger)" : "var(--ink)",
              }}
              aria-label="Toggle wishlist"
              onClick={handleWishlist}
            >
              <HeartIcon size={19} filled={inWishlist} />
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <TruckIcon size={17} />, label: "Free shipping ₹500+" },
              { icon: <RefreshIcon size={17} />, label: "7-day easy returns" },
              { icon: <ShieldIcon size={17} />, label: "Secure checkout" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--ink-muted)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="section-title mb-8 text-2xl!">Customer Reviews</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* List */}
          <div>
            {!reviews.length && (
              <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                No reviews yet — be the first to review this bag!
              </p>
            )}
            {reviews.map((review) => {
              const isOwn = user && review.user?._id === user._id;
              const isEditing = editingId === review._id;
              return (
                <div key={review._id} className="card mb-4 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                        }}
                      >
                        {(review.user?.name || "N")[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {review.user?.name || "Customer"}
                          {isOwn && (
                            <span
                              className="ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                background: "var(--accent-soft)",
                                color: "var(--accent)",
                              }}
                            >
                              Your Review
                            </span>
                          )}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: "var(--ink-faint)" }}
                        >
                          {formatDate(review.updatedAt || review.createdAt)}
                          {isOwn && review.updatedAt && review.updatedAt !== review.createdAt && " · edited"}
                        </p>
                      </div>
                    </div>

                    {/* Apne review par Edit/Delete — edit mode me chhupe */}
                    {isOwn && !isEditing && (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          className="text-[11px] font-bold uppercase tracking-wider underline"
                          style={{ color: "var(--ink-muted)" }}
                          onClick={() => startEditReview(review)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-[11px] font-bold uppercase tracking-wider underline"
                          style={{ color: "var(--danger)" }}
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {!isOwn && <RatingStars value={review.rating} size={13} />}
                  </div>

                  {isEditing ? (
                    /* Inline edit form */
                    <form onSubmit={handleUpdateReview} className="mt-3">
                      <div className="mb-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`${n} star`}
                            onClick={() => setEditRating(n)}
                          >
                            <StarIcon
                              size={20}
                              filled={n <= editRating}
                              className={n <= editRating ? "star" : "star-empty"}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="field min-h-20"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        required
                        minLength={3}
                        maxLength={500}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <RatingStars value={editRating} size={12} />
                        <span className="flex-1" />
                        <button
                          type="button"
                          className="btn btn-outline px-3! py-1.5! text-[10px]!"
                          onClick={cancelEditReview}
                          disabled={savingEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-accent px-3! py-1.5! text-[10px]!"
                          disabled={
                            savingEdit || editComment.trim().length < 3
                          }
                        >
                          {savingEdit ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p
                      className="mt-3 text-sm"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      {review.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Write review */}
          <div className="card h-fit p-6">
            <p className="eyebrow mb-3">Write a Review</p>
            {isAuthenticated ? (
              <form onSubmit={handleReview}>
                <label className="field-label">Your Rating</label>
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} star`}
                      onClick={() => setRating(n)}
                    >
                      <StarIcon
                        size={24}
                        filled={n <= rating}
                        className={n <= rating ? "star" : "star-empty"}
                      />
                    </button>
                  ))}
                </div>
                <label className="field-label">Your Review</label>
                <textarea
                  className="field min-h-28"
                  placeholder="How is the bag? Quality, size, finish…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  minLength={3}
                  maxLength={500}
                />
                <button
                  className="btn btn-accent mt-4 w-full"
                  type="submit"
                  disabled={submitting || comment.trim().length < 3}
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
                {user && reviews.some((r) => r.user?._id === user._id) && (
                  <p
                    className="mt-2 text-xs"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    Note: You can review each product only once.
                  </p>
                )}
              </form>
            ) : (
              <div>
                <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
                  Please login to write a review.
                </p>
                <Link
                  to={`/login?redirect=/product/${id}`}
                  className="btn btn-outline mt-4"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {relatedList.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-8 text-2xl!">You May Also Like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedList.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

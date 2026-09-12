import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Truck,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  PackageCheck,
  PackageSearch,
  RotateCcw,
  MessageSquare,
  Pencil,
  Trash2,
  Award,
  ShieldCheck,
  Star,
} from "lucide-react";
import { api } from "../lib/api";
import { useCartStore } from "../stores/cartStore";
import { useWishlistStore } from "../stores/wishlistStore";
import { useAuthStore } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import {
  cn,
  formatCurrency,
  getSellingPrice,
  calculateDiscount,
  getProductImages,
  getStockLabel,
  getVariantColor,
  formatDate,
  pluralize,
  buildShopSearch,
} from "../lib/utils";
import ImageWithFallback from "../components/common/ImageWithFallback";
import PriceTag from "../components/common/PriceTag";
import RatingStars from "../components/common/RatingStars";
import EmptyState from "../components/common/EmptyState";
import TrustStrip, { TrustLockIcon } from "../components/common/TrustStrip";
import FormField from "../components/common/FormField";
import { Spinner } from "../components/common/PageLoader";
import ProductCard from "../components/product/ProductCard";
import usePageTitle from "../hooks/usePageTitle";

const STOCK_PILL = { success: "pill-success", gold: "pill-stock", muted: "pill-out" };
const REVIEWS_PAGE = 4;
const REVIEW_MAX = 500;

const TRUST_ITEMS = [
  { icon: Award, title: "Full-grain leather", desc: "Uncorrected hides that gain a rich patina with time." },
  { icon: ShieldCheck, title: "3-year stitch guarantee", desc: "Lifetime repair support from our atelier." },
  { icon: TrustLockIcon, title: "Secure checkout", desc: "UPI, cards and cash on delivery, fully encrypted." },
];

const DETAIL_BULLETS = [
  "Antique brass zip closure with protective base studs",
  "Interior zip pocket and magnetic phone slip pocket",
  "Detachable, adjustable leather shoulder strap",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "N";
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function Eyebrow({ children, className }) {
  return (
    <span className={cn("eyebrow flex items-center gap-3", className)}>
      <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function PdpSkeleton() {
  return (
    <div className="container-x page-top pb-20 lg:pb-24" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading product</span>
      <div className="h-3 w-56 max-w-full rounded-full skeleton-shimmer" />
      <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-16">
        <div className="relative lg:pl-25">
          <div className="aspect-4/5 w-full rounded-3xl skeleton-shimmer" />
          <div className="mt-3 flex gap-3 lg:absolute lg:inset-y-0 lg:left-0 lg:mt-0 lg:w-21 lg:flex-col">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-4/5 w-18 shrink-0 rounded-xl skeleton-shimmer lg:w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 w-28 rounded-full skeleton-shimmer" />
          <div className="h-10 w-4/5 rounded-xl skeleton-shimmer" />
          <div className="h-10 w-3/5 rounded-xl skeleton-shimmer" />
          <div className="h-4 w-40 rounded-full skeleton-shimmer" />
          <div className="mt-6 h-9 w-48 rounded-xl skeleton-shimmer" />
          <div className="h-6 w-24 rounded-full skeleton-shimmer" />
          <div className="mt-6 flex gap-3">
            <div className="size-10 rounded-full skeleton-shimmer" />
            <div className="size-10 rounded-full skeleton-shimmer" />
            <div className="size-10 rounded-full skeleton-shimmer" />
          </div>
          <div className="mt-6 h-14 w-full rounded-2xl skeleton-shimmer" />
          <div className="h-14 w-full rounded-2xl skeleton-shimmer" />
          <div className="mt-6 h-32 w-full rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery                                                             */
/* ------------------------------------------------------------------ */

function PdpGallery({ product, images, index, onSelect, isSaved, onToggleWishlist, discountPercent }) {
  const zoomRef = useRef(null);
  const thumbRefs = useRef([]);
  const count = images.length;
  const stockInfo = getStockLabel(product);
  const current = images[index] || images[0];

  const canZoom = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleMove = (e) => {
    const el = zoomRef.current;
    if (!el || !canZoom()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    el.style.transformOrigin = `${x}% ${y}%`;
    el.style.transform = "scale(1.6)";
  };

  const handleLeave = () => {
    const el = zoomRef.current;
    if (el) el.style.transform = "scale(1)";
  };

  const select = (i) => {
    if (!count) return;
    const next = (i + count) % count;
    onSelect(next);
    const btn = thumbRefs.current[next];
    if (btn && typeof btn.scrollIntoView === "function") {
      btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  };

  const onRailKeyDown = (e) => {
    const deltas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + count) % count;
    select(next);
    const btn = thumbRefs.current[next];
    if (btn) btn.focus();
  };

  return (
    <div className={cn("relative", count > 1 && "lg:pl-25")}>
      <div
        className="group relative overflow-hidden rounded-3xl border border-line bg-surface-2 shadow-soft lg:cursor-zoom-in"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div
          ref={zoomRef}
          className="transition-transform duration-500 ease-luxury will-change-transform motion-reduce:transition-none"
        >
          <ImageWithFallback
            key={`${index}-${current}`}
            src={current}
            alt={count > 1 ? `${product.name} — view ${index + 1} of ${count}` : product.name}
            ratio="4/5"
            priority
            className="rounded-3xl"
          />
        </div>

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
          {discountPercent > 0 && <span className="pill pill-sale">{discountPercent}% off</span>}
          {stockInfo.status !== "in" && (
            <span className={cn("pill", stockInfo.status === "low" ? "pill-stock" : "pill-out")}>
              {stockInfo.label}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleWishlist}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
          className={cn("icon-btn surface-glass absolute right-4 top-4 z-10 shadow-soft", isSaved && "text-gold-ink")}
        >
          <Heart
            className={cn("size-5 transition-transform duration-300", isSaved && "scale-110 fill-current")}
            aria-hidden="true"
          />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => select(index - 1)}
              aria-label="Previous image"
              className="icon-btn surface-glass absolute left-3 top-1/2 z-10 -translate-y-1/2 shadow-soft lg:hidden"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => select(index + 1)}
              aria-label="Next image"
              className="icon-btn surface-glass absolute right-3 top-1/2 z-10 -translate-y-1/2 shadow-soft lg:hidden"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <span className="pill pill-new absolute bottom-4 right-4 z-10 tabular-nums lg:hidden" aria-hidden="true">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          role="group"
          aria-label="Product images"
          onKeyDown={onRailKeyDown}
          className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto py-1 no-scrollbar lg:absolute lg:inset-y-0 lg:left-0 lg:mt-0 lg:w-21 lg:snap-y lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:py-0"
        >
          {images.map((img, i) => {
            const active = i === index;
            return (
              <button
                key={`${img}-${i}`}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => select(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "relative w-18 shrink-0 snap-start overflow-hidden rounded-xl border bg-surface-2 transition-all duration-300 ease-luxury lg:w-full",
                  active ? "border-foreground shadow-soft" : "border-line opacity-70 hover:border-line-strong hover:opacity-100"
                )}
              >
                <ImageWithFallback src={img} alt="" ratio="4/5" className="rounded-[inherit]" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

function PdpAccordion({ id, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  return (
    <div className="border-b border-line last:border-b-0">
      <h3 className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-gold-ink"
        >
          <span className="font-serif text-lg text-foreground">{title}</span>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-gold-ink transition-transform duration-300 ease-luxury",
              open && "rotate-180"
            )}
            aria-hidden="true"
          >
            <ChevronDown className="size-4" />
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-400 ease-luxury motion-reduce:transition-none",
          open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

function PdpReviewSummary({ average, count, reviews }) {
  const dist = useMemo(() => {
    const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const n = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      d[n] += 1;
    });
    return d;
  }, [reviews]);
  const total = reviews.length;

  return (
    <div className="surface-card p-6">
      <div className="flex items-end gap-4">
        <span className="font-serif text-6xl leading-none text-foreground tabular-nums">{average.toFixed(1)}</span>
        <div className="pb-1">
          <RatingStars value={average} size="lg" />
          <p className="mt-1.5 text-small text-ink-muted">Based on {pluralize(count, "review")}</p>
        </div>
      </div>
      <ul className="mt-6 space-y-2" aria-label="Rating breakdown">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = dist[star];
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <li key={star} className="flex items-center gap-3 text-small" aria-label={`${star} stars: ${pluralize(n, "review")}`}>
              <span className="flex w-8 shrink-0 items-center gap-1 text-ink-muted tabular-nums" aria-hidden="true">
                {star}
                <Star className="size-3 fill-champagne text-champagne" />
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-champagne transition-[width] duration-700 ease-luxury"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-6 text-right text-ink-soft tabular-nums" aria-hidden="true">
                {n}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PdpReviewCard({ review, isOwn, onEdit, onDelete, deleting }) {
  const [confirm, setConfirm] = useState(false);
  const name = review.user?.name || "Niya client";
  const date = formatDate(review.createdAt);

  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-soft font-serif text-sm font-semibold text-gold-ink"
            aria-hidden="true"
          >
            {getInitials(name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-small font-semibold text-foreground">{name}</span>
              {review.verifiedPurchase && (
                <span className="pill pill-success">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Verified purchase
                </span>
              )}
            </div>
            {date && (
              <time dateTime={review.createdAt} className="text-xs text-ink-soft">
                {date}
              </time>
            )}
          </div>
        </div>
        <RatingStars value={review.rating} size="sm" className="shrink-0" />
      </div>

      <p className="mt-4 whitespace-pre-line wrap-break-word text-body text-foreground">{review.comment}</p>

      {isOwn && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="mr-auto text-micro text-ink-soft">Your review</span>
          {confirm ? (
            <>
              <span className="text-small text-ink-muted">Delete this review?</span>
              <button
                type="button"
                onClick={() => onDelete(review)}
                disabled={deleting}
                aria-busy={deleting || undefined}
                className="btn btn-danger btn-sm"
              >
                {deleting && <Spinner className="size-3.5" />}
                <span>Delete</span>
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onEdit(review)} className="btn btn-ghost btn-sm">
                <Pencil className="size-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button type="button" onClick={() => setConfirm(true)} className="btn btn-ghost btn-sm text-danger">
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProductDetailPage() {
  const { id } = useParams();
  // Keyed so every local state (variant, quantity, review form) resets per product.
  return <PdpContent key={id} id={id} />;
}

function PdpContent({ id }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(null); // "bag" | "buy" | null

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PAGE);

  // Sticky bar visibility
  const [ctaInView, setCtaInView] = useState(true);
  const [endInView, setEndInView] = useState(false);
  const ctaRef = useRef(null);
  const endRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);

  const { addToCart, closeCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const settings = useSettingsStore((s) => s.settings);
  const freeShippingFloor =
    typeof settings?.freeShippingThreshold === "number" ? settings.freeShippingThreshold : 500;

  usePageTitle(product?.name);

  // Load product and approved reviews
  useEffect(() => {
    let cancelled = false;
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [prodRes, reviewsRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/${id}`).catch(() => ({ data: { reviews: [] } })),
        ]);
        if (cancelled) return;

        const prod = prodRes.data?.product;
        if (!prod) {
          setError("Product not found");
          return;
        }

        setProduct(prod);
        setReviews(reviewsRes.data?.reviews || []);

        // Default to first variant if exists
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }
        setSelectedImageIndex(0);
      } catch (err) {
        if (cancelled) return;
        console.error("PDP fetch error:", err);
        setError("Unable to load product details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Related pieces from the same category
  useEffect(() => {
    const categoryId = product?.categoryId?._id || product?.categoryId;
    if (!product?._id || !categoryId) return undefined;
    let cancelled = false;
    api
      .get("/products", { params: { categoryId, limit: 5, isActive: true } })
      .then((res) => {
        if (cancelled) return;
        const list = (res.data?.products || [])
          .filter((p) => p && String(p._id) !== String(product._id))
          .slice(0, 4);
        setRelated(list);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  // Mobile sticky bar: show once the buy-box CTA leaves the viewport, hide at page end
  useEffect(() => {
    const cta = ctaRef.current;
    const end = endRef.current;
    if (!cta || !end || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === cta) setCtaInView(entry.isIntersecting);
          else if (entry.target === end) setEndInView(entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    io.observe(cta);
    io.observe(end);
    return () => io.disconnect();
  }, [product]);

  const images = useMemo(
    () => getProductImages(product, selectedVariant?.name || null),
    [product, selectedVariant]
  );

  if (loading) return <PdpSkeleton />;

  if (error || !product) {
    return (
      <div className="container-x page-top pb-20 lg:pb-24">
        <EmptyState
          icon={PackageSearch}
          title="This piece is no longer available"
          description="It may have been retired from the collection or the link has changed. Explore the pieces currently in the atelier."
          action={{ label: "Browse the collection", to: "/shop" }}
          secondaryAction={{ label: "Back to home", to: "/" }}
        />
      </div>
    );
  }

  const safeIndex = Math.min(selectedImageIndex, Math.max(0, images.length - 1));
  const price = product.price || 0;
  const sellingPrice = getSellingPrice(product);
  const discountPercent = calculateDiscount(price, sellingPrice);
  const isSaved = isInWishlist(product._id);
  const stock = Number(product.stock) || 0;
  const outOfStock = stock <= 0;
  const stockInfo = getStockLabel(product);
  const variants = Array.isArray(product.variants) ? product.variants.filter((v) => v && v.name) : [];
  const collections = Array.isArray(product.collections)
    ? product.collections.filter((c) => c && typeof c === "object" && c.name)
    : [];
  const categoryId = product.categoryId?._id || product.categoryId;
  const categoryName = product.categoryId?.name || "";
  const genderLabel = Array.isArray(product.gender) ? product.gender.join(" & ") : product.gender || "";
  const averageRating = Number(product.averageRating) || 0;
  const reviewCount = Number(product.numOfReviews) || reviews.length;
  const summaryAverage =
    averageRating > 0
      ? averageRating
      : reviews.length
        ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length
        : 0;
  const summaryCount = Math.max(reviewCount, reviews.length);
  const userId = user?._id || user?.id;
  const ownReview = userId
    ? reviews.find((r) => String(r.user?._id || r.user) === String(userId)) || null
    : null;
  const showBar = !ctaInView && !endInView;
  const currentPath = location.pathname;

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0); // Reset gallery to first image of that variant
  };

  const handleAdd = async (mode) => {
    if (outOfStock || adding) return;
    setAdding(mode);
    try {
      const res = await addToCart({
        product,
        variantName: selectedVariant?.name || null,
        quantity,
      });
      if (mode === "buy" && res?.success) {
        closeCart();
        navigate("/checkout");
      }
    } finally {
      setAdding(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setReviewComment("");
    setReviewRating(5);
    setReviewError("");
  };

  const startEdit = (rev) => {
    setEditingId(rev._id);
    setReviewRating(Number(rev.rating) || 5);
    setReviewComment(rev.comment || "");
    setReviewError("");
    setReviewSuccess("");
    setActionError("");
    window.setTimeout(() => {
      if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      if (textareaRef.current) textareaRef.current.focus({ preventScroll: true });
    }, 60);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewError("Please sign in to write a review.");
      return;
    }
    const comment = reviewComment.trim();
    if (comment.length < 5) {
      setReviewError("Review must be at least 5 characters.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewSuccess("");

      if (editingId) {
        const res = await api.put(`/reviews/${editingId}`, {
          rating: reviewRating,
          comment,
        });
        // Edited reviews return to moderation, so they leave the public list.
        setReviews((prev) => prev.filter((r) => r._id !== editingId));
        setReviewSuccess(
          res.data?.message
            ? `${res.data.message} — it will appear again once approved.`
            : "Your review was updated and will appear again once approved."
        );
        setEditingId(null);
      } else {
        const res = await api.post("/reviews", {
          product: product._id,
          rating: reviewRating,
          comment,
        });
        setReviewSuccess(
          res.data?.message || "Thank you! Your review was submitted and will appear once verified."
        );
      }
      setReviewComment("");
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
          (editingId
            ? "Failed to update your review. Please try again."
            : "Failed to submit review. You may have already reviewed this piece.")
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (rev) => {
    setDeletingId(rev._id);
    setActionError("");
    try {
      await api.delete(`/reviews/${rev._id}`);
      setReviews((prev) => prev.filter((r) => r._id !== rev._id));
      if (editingId === rev._id) cancelEdit();
    } catch (err) {
      setActionError(err.response?.data?.message || "Could not delete the review. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const visibleList = reviews.slice(0, visibleReviews);

  return (
    <div className="container-x page-top pb-20 lg:pb-24">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-micro text-ink-soft">
          <li className="flex items-center gap-1.5">
            <Link to="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-3 opacity-60" aria-hidden="true" />
          </li>
          <li className="flex items-center gap-1.5">
            <Link to="/shop" className="transition-colors hover:text-foreground">
              Shop
            </Link>
            <ChevronRight className="size-3 opacity-60" aria-hidden="true" />
          </li>
          {categoryId && categoryName && (
            <li className="flex items-center gap-1.5">
              <Link to={buildShopSearch({ categoryId })} className="transition-colors hover:text-foreground">
                {categoryName}
              </Link>
              <ChevronRight className="size-3 opacity-60" aria-hidden="true" />
            </li>
          )}
          <li className="min-w-0">
            <span aria-current="page" className="block max-w-56 truncate text-foreground sm:max-w-xs">
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* Gallery + buy box */}
      <div className="mt-6 grid grid-cols-1 items-start gap-10 sm:mt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-16">
        <div className="min-w-0 lg:sticky lg:top-28">
          <PdpGallery
            product={product}
            images={images}
            index={safeIndex}
            onSelect={setSelectedImageIndex}
            isSaved={isSaved}
            onToggleWishlist={() => toggleWishlist(product)}
            discountPercent={discountPercent}
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-28">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Eyebrow>{product.brand || "Niya Bags"}</Eyebrow>
            {collections.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Collections">
                {collections.map((c) => (
                  <li key={c._id || c.name}>
                    <Link
                      to={buildShopSearch({ collections: c._id })}
                      className="pill pill-gold transition-colors hover:bg-champagne hover:text-onyx"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h1 className="text-h1 mt-3 wrap-break-word text-foreground">{product.name}</h1>

          <div className="mt-3">
            {summaryCount > 0 ? (
              <a
                href="#reviews"
                className="inline-flex flex-wrap items-center gap-2 text-small text-ink-muted transition-colors hover:text-foreground"
              >
                <RatingStars value={summaryAverage} size="sm" showValue />
                <span className="link-underline">{pluralize(summaryCount, "review")}</span>
              </a>
            ) : (
              <a href="#reviews" className="link-underline text-small text-ink-soft">
                No reviews yet — be the first
              </a>
            )}
          </div>

          <div className="mt-5">
            <PriceTag product={product} size="xl" />
            <p className="mt-1.5 text-micro text-ink-soft">Inclusive of all taxes</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <span className={cn("pill", STOCK_PILL[stockInfo.tone] || "pill-muted")}>
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {stockInfo.label}
            </span>
            {!outOfStock && <span className="text-small text-ink-muted">Dispatched in 24–48 hours</span>}
          </div>

          {/* Colour */}
          {variants.length > 0 && (
            <div className="mt-6" role="group" aria-labelledby="pdp-colour-label">
              <p id="pdp-colour-label" className="label-luxury">
                Colour:{" "}
                <span className="normal-case tracking-normal text-foreground">
                  {selectedVariant?.name || "Select a colour"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {variants.map((v) => {
                  const selected = selectedVariant?.name === v.name;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => handleVariantSelect(v)}
                      aria-pressed={selected}
                      aria-label={v.name}
                      title={v.name}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full border transition-all duration-300 ease-luxury",
                        selected
                          ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : "border-line hover:border-line-strong"
                      )}
                    >
                      <span
                        className="size-7 rounded-full border border-onyx/10 shadow-inner"
                        style={{ backgroundColor: getVariantColor(v) }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <p className="label-luxury" id="pdp-qty-label">
              Quantity
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-labelledby="pdp-qty-label"
                className="inline-flex h-12 items-center rounded-xl border border-line bg-surface px-1"
              >
                <button
                  type="button"
                  className="icon-btn disabled:pointer-events-none disabled:opacity-35"
                  aria-label="Decrease quantity"
                  disabled={outOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="price w-10 text-center text-sm text-foreground" aria-live="polite" aria-atomic="true">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="icon-btn disabled:pointer-events-none disabled:opacity-35"
                  aria-label="Increase quantity"
                  disabled={outOfStock || quantity >= stock}
                  onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
              {!outOfStock && quantity >= stock && (
                <span className="text-small text-ink-soft">Maximum available</span>
              )}
            </div>
          </div>

          {/* CTA row */}
          <div ref={ctaRef} className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAdd("bag")}
              disabled={outOfStock || adding !== null}
              aria-busy={adding === "bag" || undefined}
              className="btn btn-primary btn-lg btn-block btn-luxury min-w-0 flex-1"
            >
              {adding === "bag" ? <Spinner className="size-4" /> : <ShoppingBag aria-hidden="true" />}
              <span>{outOfStock ? "Sold out" : "Add to bag"}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={isSaved}
              aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
              className={cn("btn btn-secondary btn-icon size-14 shrink-0", isSaved && "border-gold-ink text-gold-ink")}
            >
              <Heart className={cn("size-5", isSaved && "fill-current")} aria-hidden="true" />
            </button>
          </div>
          {!outOfStock && (
            <button
              type="button"
              onClick={() => handleAdd("buy")}
              disabled={adding !== null}
              aria-busy={adding === "buy" || undefined}
              className="btn btn-secondary btn-lg btn-block mt-3"
            >
              {adding === "buy" && <Spinner className="size-4" />}
              <span>Buy now</span>
            </button>
          )}

          {/* Delivery promise */}
          <ul className="surface-panel mt-6 divide-y divide-line px-4">
            <li className="flex items-center gap-3 py-3">
              <Truck className="size-4 shrink-0 text-gold-ink" aria-hidden="true" />
              <span className="text-small text-foreground">
                Free shipping on orders over <strong className="font-semibold">{formatCurrency(freeShippingFloor)}</strong>
              </span>
            </li>
            <li className="flex items-center gap-3 py-3">
              <PackageCheck className="size-4 shrink-0 text-gold-ink" aria-hidden="true" />
              <span className="text-small text-foreground">Dispatched from the atelier in 24–48 hours</span>
            </li>
            <li className="flex items-center gap-3 py-3">
              <RotateCcw className="size-4 shrink-0 text-gold-ink" aria-hidden="true" />
              <span className="text-small text-foreground">7-day returns with doorstep pickup</span>
            </li>
          </ul>

          <TrustStrip variant="list" items={TRUST_ITEMS} className="mt-4" />

          {/* Meta */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-micro text-ink-soft">SKU</dt>
              <dd className="mt-1 break-all text-small text-foreground tabular-nums">{product.sku || "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-micro text-ink-soft">Category</dt>
              <dd className="mt-1 text-small text-foreground">
                {categoryId && categoryName ? (
                  <Link to={buildShopSearch({ categoryId })} className="link-underline">
                    {categoryName}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-micro text-ink-soft">Designed for</dt>
              <dd className="mt-1 text-small text-foreground">{genderLabel || "Everyone"}</dd>
            </div>
          </dl>

          {/* Accordions */}
          <div className="mt-6 border-t border-line">
            <PdpAccordion id="pdp-details" title="Details & craft" defaultOpen>
              <p className="max-w-prose text-body text-ink-muted">
                {product.description ||
                  "Meticulously proportioned with an architectural silhouette. Reinforced hand-stitched handles, solid brass hardware and dual interior compartments lined with cotton twill."}
              </p>
              <ul className="mt-4 space-y-2">
                {DETAIL_BULLETS.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-small text-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-champagne" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </PdpAccordion>
            <PdpAccordion id="pdp-materials" title="Materials & care">
              <div className="max-w-prose space-y-3 text-body text-ink-muted">
                <p>
                  Crafted from natural full-grain leather, slowly vegetable-tanned with tree bark extracts. Every
                  patina develops its own character over years of use.
                </p>
                <p>
                  Dust with a soft cloth and treat with a beeswax balm every six months. Avoid prolonged moisture
                  and store in the cotton dust bag when not in use.
                </p>
              </div>
            </PdpAccordion>
            <PdpAccordion id="pdp-shipping" title="Shipping & returns">
              <div className="max-w-prose space-y-3 text-body text-ink-muted">
                <p>
                  Orders are dispatched within 24–48 hours in a cotton dust bag and a gift-ready rigid box. Free
                  insured shipping applies on orders over {formatCurrency(freeShippingFloor)}.
                </p>
                <p>
                  Enjoy an effortless 7-day return service with doorstep pickup. Returned pieces must be unused with
                  tags and dust bag intact.
                </p>
              </div>
            </PdpAccordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section
        id="reviews"
        aria-labelledby="reviews-heading"
        className="mt-16 scroll-mt-32 border-t border-line pt-12 sm:mt-24 sm:pt-16"
      >
        <div className="max-w-2xl">
          <Eyebrow>Client reviews</Eyebrow>
          <h2 id="reviews-heading" className="text-h2 mt-3 text-foreground">
            What owners say
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] xl:gap-12">
          <div className="min-w-0 space-y-6">
            {summaryCount > 0 && (
              <PdpReviewSummary average={summaryAverage} count={summaryCount} reviews={reviews} />
            )}

            {user ? (
              <div ref={formRef} className="surface-card scroll-mt-32 p-6">
                <h3 className="text-h3 text-foreground">{editingId ? "Edit your review" : "Write a review"}</h3>
                <p className="mt-1 text-small text-ink-muted">
                  Tell others about the leather, the hardware and how it wears day to day.
                </p>

                {reviewSuccess ? (
                  <div role="status" className="surface-panel mt-5 flex items-start gap-3 p-4">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <p className="text-small text-foreground">{reviewSuccess}</p>
                  </div>
                ) : ownReview && !editingId ? (
                  <div className="surface-panel mt-5 p-4">
                    <p className="text-small text-foreground">You have already reviewed this piece.</p>
                    <button type="button" onClick={() => startEdit(ownReview)} className="btn btn-secondary btn-sm mt-3">
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span>Edit your review</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="mt-5 space-y-5" noValidate>
                    <div>
                      <p className="label-luxury">Your rating</p>
                      <RatingStars value={reviewRating} onChange={setReviewRating} size="xl" label="Your rating" />
                    </div>

                    <FormField
                      label="Your review"
                      required
                      hint={`${reviewComment.length}/${REVIEW_MAX} characters`}
                      error={reviewError}
                    >
                      <textarea
                        ref={textareaRef}
                        className="textarea-luxury"
                        rows={4}
                        maxLength={REVIEW_MAX}
                        value={reviewComment}
                        onChange={(e) => {
                          setReviewComment(e.target.value);
                          setReviewError("");
                        }}
                        placeholder="How does it feel in everyday use? What do you think of the craftsmanship?"
                      />
                    </FormField>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={submittingReview || !reviewComment.trim()}
                        aria-busy={submittingReview || undefined}
                        className="btn btn-primary btn-block sm:w-auto sm:flex-1"
                      >
                        {submittingReview && <Spinner className="size-4" />}
                        <span>{editingId ? "Save changes" : "Submit review"}</span>
                      </button>
                      {editingId && (
                        <button type="button" onClick={cancelEdit} className="btn btn-ghost">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="surface-panel p-6">
                <h3 className="text-h3 text-foreground">Share your experience</h3>
                <p className="mt-1 text-small text-ink-muted">Sign in to write a review for this piece.</p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(currentPath)}`}
                  className="btn btn-primary btn-sm mt-4"
                >
                  Sign in to review
                </Link>
              </div>
            )}
          </div>

          <div className="min-w-0">
            {actionError && (
              <p role="alert" className="surface-panel mb-4 p-4 text-small text-danger">
                {actionError}
              </p>
            )}
            {reviews.length === 0 ? (
              <EmptyState
                compact
                icon={MessageSquare}
                title="No reviews yet"
                description="Be the first to share how this piece wears. Approved reviews appear here."
              />
            ) : (
              <>
                <div className="space-y-4">
                  {visibleList.map((rev) => (
                    <PdpReviewCard
                      key={rev._id}
                      review={rev}
                      isOwn={Boolean(userId) && String(rev.user?._id || rev.user) === String(userId)}
                      onEdit={startEdit}
                      onDelete={handleDeleteReview}
                      deleting={deletingId === rev._id}
                    />
                  ))}
                </div>
                {reviews.length > visibleReviews && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-small text-ink-soft">
                      Showing {visibleList.length} of {pluralize(reviews.length, "review")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisibleReviews((n) => n + REVIEWS_PAGE)}
                      className="btn btn-secondary btn-sm"
                    >
                      Show more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 border-t border-line pt-12 sm:mt-24 sm:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Complete the look</Eyebrow>
              <h2 id="related-heading" className="text-h2 mt-3 text-foreground">
                You may also like
              </h2>
            </div>
            {categoryId && categoryName && (
              <Link to={buildShopSearch({ categoryId })} className="link-underline text-micro text-foreground">
                View all {categoryName}
              </Link>
            )}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div ref={endRef} aria-hidden="true" className="h-px" />

      {/* Mobile sticky add-to-bag bar */}
      <div
        role="region"
        aria-label="Quick add to bag"
        aria-hidden={!showBar}
        className={cn(
          "surface-glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 px-4 pt-3 transition-[transform,opacity,visibility] duration-300 ease-luxury lg:hidden",
          showBar ? "visible translate-y-0 opacity-100" : "invisible translate-y-full opacity-0"
        )}
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {/* Right padding keeps the CTA clear of the floating back-to-top button. */}
        <div className="mx-auto flex max-w-7xl items-center gap-3 pr-14 sm:pr-16">
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-semibold text-foreground">{product.name}</p>
            <PriceTag product={product} size="md" showDiscount={false} />
          </div>
          <button
            type="button"
            onClick={() => handleAdd("bag")}
            disabled={outOfStock || adding !== null}
            aria-busy={adding === "bag" || undefined}
            tabIndex={showBar ? 0 : -1}
            className="btn btn-primary btn-luxury shrink-0"
          >
            {adding === "bag" ? <Spinner className="size-4" /> : <ShoppingBag aria-hidden="true" />}
            <span>{outOfStock ? "Sold out" : "Add to bag"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

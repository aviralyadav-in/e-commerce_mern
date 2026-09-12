import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useWishlistStore } from "../../stores/wishlistStore";
import { useCartStore } from "../../stores/cartStore";
import ImageWithFallback from "../common/ImageWithFallback";
import PriceTag from "../common/PriceTag";
import RatingStars from "../common/RatingStars";
import { Spinner } from "../common/PageLoader";
import {
  cn,
  calculateDiscount,
  clampText,
  getProductImages,
  getSellingPrice,
  getStockLabel,
  getVariantColor,
} from "../../lib/utils";

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SWATCHES = 5;

/**
 * Hover-reveal helpers. Every reveal responds to a real pointer hover
 * (`group-hover`, media-guarded by Tailwind), keyboard focus inside the card
 * (`group-focus-within`) and a JS hover flag (`data-hovered`) so synthetic
 * mouseenter events (tests / screenshots) reach the same state.
 */
const REVEAL =
  "opacity-0 pointer-events-none " +
  "group-hover:opacity-100 group-hover:pointer-events-auto " +
  "group-focus-within:opacity-100 group-focus-within:pointer-events-auto " +
  "group-data-hovered:opacity-100 group-data-hovered:pointer-events-auto";
const REVEAL_LIFT =
  "translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0 group-data-hovered:translate-y-0";
const REVEAL_DROP =
  "-translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0 group-data-hovered:translate-y-0";
const ZOOM = "group-hover:scale-105 group-focus-within:scale-105 group-data-hovered:scale-105";
const CROSSFADE =
  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-data-hovered:opacity-100";
const FLOATING_BTN = "icon-btn bg-surface/90 text-foreground shadow-soft backdrop-blur-md";

function isNewArrival(createdAt) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  const age = Date.now() - t;
  return age >= 0 && age < NEW_WINDOW_MS;
}

function CardPills({ discount, stock, isNew, className }) {
  const items = [];
  if (discount > 0) items.push({ key: "sale", cls: "pill-sale", label: `${discount}% off` });
  if (stock.status === "low") items.push({ key: "low", cls: "pill-stock", label: stock.label });
  if (stock.status === "out") items.push({ key: "out", cls: "pill-out", label: stock.label });
  if (isNew && stock.status !== "out") items.push({ key: "new", cls: "pill-new", label: "New" });
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5",
        className
      )}
    >
      {items.map((item) => (
        <span key={item.key} className={cn("pill shadow-soft", item.cls)}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function Swatches({ variants, activeName, onSelect, className }) {
  if (!variants.length) return null;
  const shown = variants.slice(0, MAX_SWATCHES);
  const extra = variants.length - shown.length;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      role="group"
      aria-label="Colour options"
    >
      {shown.map((variant) => {
        const selected = variant.name === activeName;
        return (
          <button
            key={variant.name}
            type="button"
            title={variant.name}
            aria-label={`Colour: ${variant.name}`}
            aria-pressed={selected}
            onClick={(e) => onSelect(e, variant.name)}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block size-4 rounded-full border border-line-strong/70 transition-shadow",
                selected && "ring-2 ring-foreground ring-offset-2 ring-offset-surface"
              )}
              style={{ backgroundColor: getVariantColor(variant) }}
            />
          </button>
        );
      })}
      {extra > 0 && (
        <span className="ml-1 text-small tabular-nums text-ink-soft" title={`${extra} more colours`}>
          +{extra}
        </span>
      )}
    </div>
  );
}

function WishlistButton({ isSaved, onClick, className, iconClassName }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(className, isSaved && "text-gold-ink")}
    >
      <Heart
        className={cn(
          "size-4.5 transition-transform duration-300 ease-luxury",
          iconClassName,
          isSaved && "scale-110 fill-current"
        )}
      />
    </button>
  );
}

/**
 * Product card used on the home page, shop grid and wishlist.
 * props: product, onQuickView(product), layout "grid" | "list", priority (eager image)
 */
export default function ProductCard({ product, onQuickView, layout = "grid", priority = false }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isSaved = useWishlistStore((s) => (product ? s.isInWishlist(product._id) : false));
  const addToCart = useCartStore((s) => s.addToCart);

  if (!product) return null;

  const productUrl = `/product/${product._id}`;
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((v) => v && v.name)
    : [];
  const activeVariantName = selectedVariant || variants[0]?.name || null;
  const images = getProductImages(product, activeVariantName);
  const primaryImage = images[0];
  const altImage = images[1] && images[1] !== images[0] ? images[1] : null;

  const stock = getStockLabel(product);
  const isOut = stock.status === "out";
  const discount = calculateDiscount(Number(product.price) || 0, getSellingPrice(product));
  const isNew = isNewArrival(product.createdAt);
  const brand = product.brand || "Niya Bags";
  const hasRating = Number(product.averageRating) > 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOut || isAdding) return;
    try {
      setIsAdding(true);
      await addToCart({ product, variantName: activeVariantName, quantity: 1 });
    } finally {
      setIsAdding(false);
    }
  };

  const handleVariantSelect = (e, name) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(name);
  };

  const rootProps = {
    "data-slot": "product-card",
    "data-layout": layout,
    "data-hovered": isHovered || undefined,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  const addLabel = isOut ? "Sold out" : "Add to bag";
  const addIcon = isAdding ? <Spinner className="size-4" /> : <ShoppingBag className="size-4" />;

  /* ------------------------------------------------------------------ */
  /* List layout                                                         */
  /* ------------------------------------------------------------------ */
  if (layout === "list") {
    return (
      <article
        {...rootProps}
        className="group surface-card relative flex flex-wrap gap-4 p-4 luxury-card-hover hover:luxury-shadow-hover hover:border-champagne/60 focus-within:luxury-shadow-hover sm:flex-nowrap sm:gap-6 sm:p-5"
      >
        <Link
          to={productUrl}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block w-28 shrink-0 self-start overflow-hidden rounded-xl bg-surface-2 sm:w-40 md:w-44"
        >
          <ImageWithFallback
            src={primaryImage}
            alt=""
            ratio="1/1"
            priority={priority}
            className={cn("rounded-xl transition-transform duration-700 ease-luxury", ZOOM)}
          />
          {altImage && (
            <ImageWithFallback
              src={altImage}
              alt=""
              fill
              className={cn("scale-105 transition-opacity duration-700 ease-luxury", CROSSFADE)}
            />
          )}
          <CardPills discount={discount} stock={stock} isNew={isNew} className="left-2 top-2" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-micro truncate text-gold-ink">{brand}</span>
          <h3 className="text-h3 line-clamp-2 text-foreground">
            <Link to={productUrl} className="transition-colors duration-300 hover:text-gold-ink">
              {product.name}
            </Link>
          </h3>
          {hasRating && (
            <RatingStars
              value={product.averageRating}
              count={Number(product.numOfReviews) || 0}
              size="sm"
              showValue
            />
          )}
          {product.description && (
            <p className="hidden text-small leading-relaxed text-ink-muted sm:block">
              {clampText(product.description, 140)}
            </p>
          )}
          <Swatches
            variants={variants}
            activeName={activeVariantName}
            onSelect={handleVariantSelect}
            className="-ml-1.5"
          />
          <PriceTag product={product} size="lg" className="mt-auto pt-1" />
        </div>

        <div className="flex basis-full items-center gap-2 border-t border-line pt-4 sm:w-44 sm:shrink-0 sm:basis-auto sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOut || isAdding}
            aria-busy={isAdding || undefined}
            className="btn btn-primary btn-sm flex-1 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            {addIcon}
            <span>{addLabel}</span>
          </button>
          {onQuickView && (
            <>
              <button
                type="button"
                onClick={handleQuickView}
                className="btn btn-ghost btn-sm hidden border border-line sm:inline-flex"
              >
                <Eye className="size-4" />
                <span>Quick view</span>
              </button>
              <button
                type="button"
                onClick={handleQuickView}
                aria-label="Quick view"
                title="Quick view"
                className="icon-btn border border-line sm:hidden"
              >
                <Eye className="size-4.5" />
              </button>
            </>
          )}
          <WishlistButton
            isSaved={isSaved}
            onClick={handleWishlist}
            className="icon-btn border border-line sm:self-center"
          />
        </div>
      </article>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Grid layout (default)                                               */
  /* ------------------------------------------------------------------ */
  return (
    <article
      {...rootProps}
      className="group surface-card relative flex h-full flex-col overflow-hidden luxury-card-hover hover:luxury-shadow-hover hover:border-champagne/60 focus-within:luxury-shadow-hover"
    >
      <div className="relative overflow-hidden bg-surface-2">
        <Link to={productUrl} tabIndex={-1} aria-hidden="true" className="relative block">
          <ImageWithFallback
            src={primaryImage}
            alt=""
            ratio="3/4"
            priority={priority}
            className={cn("transition-transform duration-700 ease-luxury", ZOOM)}
          />
          {altImage && (
            <ImageWithFallback
              src={altImage}
              alt=""
              fill
              className={cn("scale-105 transition-opacity duration-700 ease-luxury", CROSSFADE)}
            />
          )}
        </Link>

        <CardPills discount={discount} stock={stock} isNew={isNew} />

        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          <WishlistButton isSaved={isSaved} onClick={handleWishlist} className={FLOATING_BTN} />
          {onQuickView && (
            <button
              type="button"
              onClick={handleQuickView}
              aria-label="Quick view"
              title="Quick view"
              className={cn(
                FLOATING_BTN,
                "hidden transition-all duration-300 ease-luxury lg:pointer-fine:inline-flex",
                REVEAL,
                REVEAL_DROP
              )}
            >
              <Eye className="size-4.5" />
            </button>
          )}
        </div>

        {/* Desktop / mouse: slide-up quick add */}
        <div
          className={cn(
            "absolute inset-x-3 bottom-3 z-10 hidden transition-all duration-300 ease-luxury lg:pointer-fine:block",
            REVEAL,
            REVEAL_LIFT
          )}
        >
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOut || isAdding}
            aria-busy={isAdding || undefined}
            className="btn btn-sm btn-block bg-onyx text-ivory shadow-lift hover:bg-champagne-dark hover:text-onyx disabled:cursor-not-allowed disabled:opacity-70"
          >
            {addIcon}
            <span>{addLabel}</span>
          </button>
        </div>

        {/* Touch / narrow: compact round quick add, always visible */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isOut || isAdding}
          aria-busy={isAdding || undefined}
          aria-label={isOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
          className="absolute bottom-3 right-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-onyx text-ivory shadow-soft transition-[background-color,transform] duration-200 hover:bg-champagne-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 lg:pointer-fine:hidden"
        >
          {addIcon}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <span className="text-micro truncate text-gold-ink">{brand}</span>
        <h3 className="text-h4 line-clamp-2 text-foreground">
          <Link to={productUrl} className="transition-colors duration-300 hover:text-gold-ink">
            {product.name}
          </Link>
        </h3>
        {hasRating && (
          <RatingStars
            value={product.averageRating}
            count={Number(product.numOfReviews) || 0}
            size="sm"
            className="mt-0.5"
          />
        )}

        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          <Swatches
            variants={variants}
            activeName={activeVariantName}
            onSelect={handleVariantSelect}
            className="-ml-1.5"
          />
          <PriceTag
            product={product}
            size="md"
            showDiscount={false}
            className="border-t border-line pt-3"
          />
        </div>
      </div>
    </article>
  );
}

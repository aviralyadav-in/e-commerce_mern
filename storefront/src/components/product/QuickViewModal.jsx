import React, { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Truck, ArrowRight, Plus, Minus, Check, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useCartStore } from "../../stores/cartStore";
import { useWishlistStore } from "../../stores/wishlistStore";
import { useSettingsStore } from "../../stores/settingsStore";
import ImageWithFallback from "../common/ImageWithFallback";
import PriceTag from "../common/PriceTag";
import RatingStars from "../common/RatingStars";
import { Spinner } from "../common/PageLoader";
import {
  cn,
  calculateDiscount,
  clampText,
  formatCurrency,
  getProductImages,
  getSellingPrice,
  getStockLabel,
  getVariantColor,
} from "../../lib/utils";

const MAX_THUMBS = 6;
const DEFAULT_DESCRIPTION =
  "Handcrafted from certified full-grain leather, finished with hand-burnished edges and solid brass hardware designed to age beautifully.";
const STOCK_PILL = { success: "pill-success", gold: "pill-stock", muted: "pill-out" };

/**
 * Quick view dialog. The inner panel is keyed on the product id so all
 * per-product state (variant, image, quantity) resets without effects.
 * props: product, isOpen, onClose
 */
export default function QuickViewModal({ product, isOpen, onClose }) {
  const open = Boolean(isOpen && product);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden bg-popover p-0 text-popover-foreground shadow-lift ring-line",
          // Mobile: full-height panel
          "bottom-0 left-0 top-auto h-dvh w-full max-w-full translate-x-0 translate-y-0 rounded-none",
          // Tablet / desktop: centred card
          "sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        )}
      >
        {product ? <QuickViewPanel key={product._id} product={product} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewPanel({ product, onClose }) {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((v) => v && v.name)
    : [];

  const [variantName, setVariantName] = useState(variants[0]?.name || null);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const thumbsRef = useRef(null);
  const qtyLabelId = useId();
  const colourLabelId = useId();

  const addToCart = useCartStore((s) => s.addToCart);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isSaved = useWishlistStore((s) => s.isInWishlist(product._id));
  const freeShippingFloor = useSettingsStore((s) => s.getFreeShippingThreshold());

  const images = getProductImages(product, variantName);
  const thumbs = images.slice(0, MAX_THUMBS);
  const safeIndex = Math.min(imageIndex, thumbs.length - 1);
  const activeImage = thumbs[safeIndex] || images[0];

  const stock = getStockLabel(product);
  const isOut = stock.status === "out";
  const stockCount = Number(product.stock);
  const maxQty = stockCount > 0 ? stockCount : Infinity;
  const discount = calculateDiscount(Number(product.price) || 0, getSellingPrice(product));
  const hasRating = Number(product.averageRating) > 0;
  const productUrl = `/product/${product._id}`;

  const handleAddToCart = async () => {
    if (isAdding || isOut) return;
    try {
      setIsAdding(true);
      await addToCart({ product, variantName: variantName || null, quantity });
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
      }, 900);
    } finally {
      setIsAdding(false);
    }
  };

  const selectVariant = (name) => {
    setVariantName(name);
    setImageIndex(0);
  };

  const focusThumb = (index) => {
    const buttons = thumbsRef.current?.querySelectorAll("button");
    buttons?.[index]?.focus();
  };

  const handleThumbKeys = (e) => {
    if (thumbs.length < 2) return;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (safeIndex + 1) % thumbs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (safeIndex - 1 + thumbs.length) % thumbs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = thumbs.length - 1;
    if (next === null) return;
    e.preventDefault();
    setImageIndex(next);
    focusThumb(next);
  };

  return (
    <>
      <DialogClose asChild>
        <button
          type="button"
          aria-label="Close quick view"
          className="icon-btn absolute right-3 top-3 z-20 bg-surface/90 text-foreground shadow-soft backdrop-blur-md sm:right-4 sm:top-4"
        >
          <X className="size-5" />
        </button>
      </DialogClose>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
          {/* Gallery */}
          <div className="bg-surface-2 p-4 sm:p-6 md:border-r md:border-line">
            <div className="relative">
              <ImageWithFallback
                key={activeImage}
                src={activeImage}
                alt={`${product.name}${thumbs.length > 1 ? ` — image ${safeIndex + 1} of ${thumbs.length}` : ""}`}
                ratio="4/5"
                priority
                className="rounded-2xl shadow-soft"
              />
              {(discount > 0 || stock.status !== "in") && (
                <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
                  {discount > 0 && <span className="pill pill-sale shadow-soft">{discount}% off</span>}
                  {stock.status === "low" && (
                    <span className="pill pill-stock shadow-soft">{stock.label}</span>
                  )}
                  {isOut && <span className="pill pill-out shadow-soft">{stock.label}</span>}
                </div>
              )}
            </div>

            {thumbs.length > 1 && (
              <div
                ref={thumbsRef}
                role="group"
                aria-label="Product images"
                onKeyDown={handleThumbKeys}
                className="mt-4 flex gap-2 overflow-x-auto pb-1"
              >
                {thumbs.map((img, index) => {
                  const active = index === safeIndex;
                  return (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      aria-label={`Show image ${index + 1} of ${thumbs.length}`}
                      aria-pressed={active}
                      onClick={() => setImageIndex(index)}
                      className={cn(
                        "size-16 shrink-0 overflow-hidden rounded-xl border bg-surface transition-all duration-300 ease-luxury",
                        active
                          ? "border-foreground ring-2 ring-ring/50 ring-offset-2 ring-offset-surface-2"
                          : "border-line opacity-70 hover:opacity-100"
                      )}
                    >
                      <ImageWithFallback src={img} alt="" ratio="1/1" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 p-5 sm:p-8">
            <DialogHeader className="gap-1.5 text-left md:pr-10">
              <span className="text-micro text-gold-ink">{product.brand || "Niya Bags"}</span>
              <DialogTitle className="font-serif text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.02em] text-balance text-foreground sm:text-[2rem]">
                {product.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Quick view of {product.name}. Choose a colour and quantity, then add it to your bag.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {hasRating ? (
                <RatingStars
                  value={product.averageRating}
                  count={Number(product.numOfReviews) || 0}
                  size="md"
                  showValue
                />
              ) : (
                <span className="text-small text-ink-soft">No reviews yet</span>
              )}
              <span className={cn("pill", STOCK_PILL[stock.tone] || "pill-muted")}>{stock.label}</span>
            </div>

            <PriceTag product={product} size="lg" />

            <p className="max-w-prose text-small leading-relaxed text-ink-muted">
              {clampText(product.description || DEFAULT_DESCRIPTION, 220)}
            </p>

            {variants.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span id={colourLabelId} className="text-micro text-foreground">
                  Colour
                  <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-muted">
                    — {variantName}
                  </span>
                </span>
                <div role="radiogroup" aria-labelledby={colourLabelId} className="-ml-1 flex flex-wrap gap-1">
                  {variants.map((variant) => {
                    const selected = variant.name === variantName;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={variant.name}
                        title={variant.name}
                        onClick={() => selectVariant(variant.name)}
                        className="inline-flex size-10 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "block size-6 rounded-full border border-line-strong/70 transition-shadow",
                            selected && "ring-2 ring-foreground ring-offset-2 ring-offset-popover"
                          )}
                          style={{ backgroundColor: getVariantColor(variant) }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span id={qtyLabelId} className="text-micro text-foreground">
                Quantity
              </span>
              <div
                role="group"
                aria-labelledby={qtyLabelId}
                className="inline-flex h-12 items-center rounded-xl border border-line bg-surface"
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="icon-btn disabled:pointer-events-none disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="price w-10 text-center text-base text-foreground" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="icon-btn disabled:pointer-events-none disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 border-t border-line pt-5 max-md:sticky max-md:bottom-0 max-md:-mx-5 max-md:bg-popover max-md:px-5 max-md:pb-5">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding || isOut}
                  aria-busy={isAdding || undefined}
                  className={cn(
                    "btn btn-primary btn-lg btn-block btn-luxury flex-1 disabled:cursor-not-allowed disabled:opacity-60",
                    added && "bg-success text-primary-foreground hover:bg-success"
                  )}
                >
                  {isAdding ? (
                    <Spinner className="size-4" />
                  ) : added ? (
                    <Check className="size-4" />
                  ) : (
                    <ShoppingBag className="size-4" />
                  )}
                  <span>{added ? "Added to bag" : isOut ? "Sold out" : "Add to bag"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                  className={cn(
                    "btn btn-secondary btn-icon size-14 shrink-0",
                    isSaved && "border-gold-ink text-gold-ink hover:border-gold-ink"
                  )}
                >
                  <Heart className={cn("size-5", isSaved && "fill-current")} />
                </button>
              </div>

              <div className="flex flex-col gap-2 text-small sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-ink-muted">
                  <Truck className="size-4 shrink-0 text-gold-ink" aria-hidden="true" />
                  Free shipping on orders over {formatCurrency(freeShippingFloor)}
                </span>
                <Link
                  to={productUrl}
                  onClick={onClose}
                  className="link-underline inline-flex items-center gap-1.5 self-start font-semibold text-foreground hover:text-gold-ink"
                >
                  View full details
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

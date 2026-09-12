import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  ChevronDown,
  Truck,
  Lock,
  RotateCcw,
  X,
} from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn, formatCurrency, getProductImages, pluralize } from "../../lib/utils";
import ImageWithFallback from "../common/ImageWithFallback";
import EmptyState from "../common/EmptyState";
import TrustStrip from "../common/TrustStrip";
import { Spinner } from "../common/PageLoader";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

const TRUST_ITEMS = [
  { icon: Lock, title: "Secure checkout" },
  { icon: RotateCcw, title: "7-day returns" },
];

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    discountAmount,
    couponLoading,
  } = useCartStore();
  // Subscribing to the whole settings store keeps the helpers in sync once
  // /settings resolves (the helpers fall back to 500 / 50 until then).
  const { getFreeShippingThreshold, getShippingFee } = useSettingsStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const navigate = useNavigate();

  const freeShippingFloor = getFreeShippingThreshold();
  const standardShippingFee = getShippingFee();

  const items = cart?.items || [];
  const itemCount = items.reduce((s, it) => s + (it.quantity || 1), 0);
  const subtotal = cart?.totalPrice || 0;
  const afterDiscount = Math.max(0, subtotal - (discountAmount || 0));
  const freeShipRemaining = Math.max(0, freeShippingFloor - afterDiscount);
  const rawProgress = Math.round((afterDiscount / freeShippingFloor) * 100);
  const freeShipProgress = Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 100);
  const shippingFee = subtotal > 0 && afterDiscount < freeShippingFloor ? standardShippingFee : 0;
  const total = Math.max(0, afterDiscount + shippingFee);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput("");
      setCouponOpen(false);
    } else {
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess("");
    setCouponError("");
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    closeCart();
    navigate("/shop");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-label="Shopping bag"
        className="flex h-full w-full flex-col gap-0 overflow-hidden border-l border-line bg-background p-0 text-foreground shadow-lift data-[side=right]:w-full data-[side=right]:sm:max-w-110"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}
        <SheetHeader className="shrink-0 gap-0 border-b border-line px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-baseline gap-2 font-serif text-xl font-semibold tracking-tight text-foreground">
              <span>Your bag</span>
              <span className="font-sans text-sm font-medium text-ink-soft">
                · {pluralize(itemCount, "item")}
              </span>
            </SheetTitle>
            <SheetClose asChild>
              <button type="button" className="icon-btn -mr-2" aria-label="Close bag">
                <X className="size-5" aria-hidden="true" />
              </button>
            </SheetClose>
          </div>
          <SheetDescription className="sr-only">
            Review the pieces in your shopping bag, adjust quantities or proceed to checkout.
          </SheetDescription>

          {items.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-2 text-small text-ink-muted">
                <Truck className="size-4 shrink-0 text-gold-ink" aria-hidden="true" />
                {freeShipRemaining === 0 ? (
                  <span className="font-semibold text-success">
                    You’ve unlocked complimentary delivery ✓
                  </span>
                ) : (
                  <span>
                    Add{" "}
                    <strong className="price text-foreground">{formatCurrency(freeShipRemaining)}</strong>{" "}
                    more for complimentary delivery
                  </span>
                )}
              </p>
              <div
                role="progressbar"
                aria-label="Progress towards complimentary delivery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={freeShipProgress}
                className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-champagne transition-[width] duration-500 ease-luxury"
                  style={{ width: `${freeShipProgress}%` }}
                />
              </div>
            </div>
          )}
        </SheetHeader>

        {/* ---------------------------------------------------------------- */}
        {/* Line items                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
          {items.length === 0 ? (
            <div className="flex h-full items-center py-6">
              <EmptyState
                compact
                icon={ShoppingBag}
                title="Your bag is empty"
                description="Discover handcrafted full-grain leather pieces made to be carried for a lifetime."
                action={{ label: "Explore the collection", onClick: handleContinueShopping }}
                className="w-full border-0 bg-transparent shadow-none"
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item, index) => {
                const prod = item.product || {};
                const productId = prod._id || prod.id || prod;
                const prodName = prod.name || "Handcrafted leather bag";
                const itemImage = getProductImages(prod, item.variantName)[0];
                const itemPrice = item.price || prod.discountPrice || prod.price || 0;
                const quantity = item.quantity || 1;
                const maxStock = typeof prod.stock === "number" ? prod.stock : null;
                const atMax = maxStock !== null && quantity >= maxStock;
                const productHref = `/product/${productId}`;

                return (
                  <li key={`${productId}-${item.variantName || "plain"}-${index}`} className="flex gap-4 py-4">
                    <Link
                      to={productHref}
                      onClick={closeCart}
                      className="shrink-0 rounded-xl"
                      aria-label={`View ${prodName}`}
                      tabIndex={-1}
                    >
                      <ImageWithFallback
                        src={itemImage}
                        alt={prodName}
                        ratio="1/1"
                        className="w-20 rounded-xl border border-line"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={productHref}
                            onClick={closeCart}
                            className="line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-gold-ink"
                          >
                            {prodName}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {item.variantName && (
                              <span className="pill pill-muted">{item.variantName}</span>
                            )}
                            <span className="text-small text-ink-muted tabular-nums">
                              {formatCurrency(itemPrice)} each
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(productId, item.variantName)}
                          className="icon-btn -mr-2 -mt-1.5 size-9 shrink-0 text-ink-soft hover:bg-danger-soft hover:text-danger"
                          aria-label={`Remove ${prodName} from bag`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <div
                          className="inline-flex h-11 items-center rounded-xl border border-line bg-surface"
                          role="group"
                          aria-label={`Quantity for ${prodName}`}
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(productId, quantity - 1, item.variantName)}
                            className="icon-btn size-10"
                            aria-label={quantity === 1 ? `Remove ${prodName}` : "Decrease quantity"}
                          >
                            <Minus className="size-3.5" aria-hidden="true" />
                          </button>
                          <span className="price w-8 text-center text-sm text-foreground" aria-live="polite">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(productId, quantity + 1, item.variantName)}
                            className="icon-btn size-10 disabled:pointer-events-none disabled:opacity-35"
                            aria-label="Increase quantity"
                            disabled={atMax}
                            title={atMax ? "Maximum available stock reached" : undefined}
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <span className="price text-base text-foreground">
                          {formatCurrency(itemPrice * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer: coupon, summary, CTAs                                     */}
        {/* ---------------------------------------------------------------- */}
        {items.length > 0 && (
          <div className="shrink-0 space-y-4 border-t border-line bg-background px-5 pb-5 pt-4 sm:px-6">
            {/* Coupon */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="pill pill-success h-8 pl-3 pr-1.5 text-[11px]">
                    <Tag className="size-3" aria-hidden="true" />
                    <span>{appliedCoupon.code}</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full transition-colors hover:bg-success/15"
                      aria-label={`Remove coupon ${appliedCoupon.code}`}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                  <span className="text-small text-ink-muted">
                    {couponSuccess || "Promo applied"}
                  </span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCouponOpen((v) => !v)}
                    aria-expanded={couponOpen}
                    aria-controls="cart-coupon-form"
                    className="flex w-full items-center justify-between rounded-lg py-1 text-small font-semibold text-foreground transition-colors hover:text-gold-ink"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Tag className="size-4 text-gold-ink" aria-hidden="true" />
                      Have a promo code?
                    </span>
                    <ChevronDown
                      className={cn("size-4 text-ink-soft transition-transform duration-300", couponOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  {couponOpen && (
                    <form id="cart-coupon-form" onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
                      <label htmlFor="cart-coupon-input" className="sr-only">
                        Promo code
                      </label>
                      <input
                        id="cart-coupon-input"
                        type="text"
                        autoComplete="off"
                        autoFocus
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="Enter code"
                        aria-invalid={couponError ? "true" : undefined}
                        aria-describedby={couponError ? "cart-coupon-error" : undefined}
                        className="input-luxury h-11 text-sm uppercase tracking-wider"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        aria-busy={couponLoading || undefined}
                        className="btn btn-primary btn-sm h-11 shrink-0"
                      >
                        {couponLoading && <Spinner className="size-4 border-current/30 border-t-current" />}
                        <span>Apply</span>
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p id="cart-coupon-error" role="alert" className="field-error">
                      {couponError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Summary */}
            <dl className="surface-panel space-y-2 p-4 text-small">
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="price text-foreground">{formatCurrency(subtotal)}</dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">
                    Discount{appliedCoupon?.code ? ` · ${appliedCoupon.code}` : ""}
                  </dt>
                  <dd className="price text-gold-ink">−{formatCurrency(discountAmount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd>
                  {shippingFee === 0 ? (
                    <span className="font-semibold text-success">Complimentary</span>
                  ) : (
                    <span className="price text-foreground">{formatCurrency(shippingFee)}</span>
                  )}
                </dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-serif text-base font-semibold text-foreground">Total</dt>
                <dd className="price text-xl text-foreground">{formatCurrency(total)}</dd>
              </div>
            </dl>

            {/* CTAs */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="btn btn-primary btn-lg btn-block btn-luxury"
              >
                <span>Proceed to checkout</span>
                <ArrowRight aria-hidden="true" />
              </button>
              <button type="button" onClick={closeCart} className="btn btn-ghost btn-block">
                Continue shopping
              </button>
            </div>

            <TrustStrip variant="row" items={TRUST_ITEMS} className="justify-center gap-x-5" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

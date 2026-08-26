import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { applyCoupon, clearCoupon } from "../../features/cart/cartSlice";
import { pushToast } from "../../features/ui/uiSlice";
import { formatCurrency } from "../../utils/format";
import { getAssetUrl } from "../../utils/assetUrl";
import { calcShipping } from "../../utils/shipping";
import {
  ShieldIcon,
  TagIcon,
  SpinnerIcon,
  ArrowRightIcon,
} from "../common/Icons";

/**
 * Checkout page ka right-side "YOUR ORDER / Order Summary" panel —
 * item thumbs, totals, TOTAL PAYABLE (gold serif) aur Confirm CTA.
 */
export default function CheckoutSummary({ placing, onPlace, canPlace }) {
  const dispatch = useDispatch();
  const { cart, coupon } = useSelector((s) => s.cart);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  const items = cart?.items || [];
  const itemCount = items.length;
  const unitCount = items.reduce((n, i) => n + (i.quantity || 0), 0);
  const subtotal = cart?.totalPrice || 0;
  const discount = coupon?.discountAmount || 0;
  const shipping = calcShipping(subtotal, discount);
  const total = Math.max(0, subtotal - discount) + shipping;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    const result = await dispatch(
      applyCoupon({ code: code.trim(), orderTotal: subtotal }),
    );
    setApplying(false);
    if (applyCoupon.fulfilled.match(result)) {
      dispatch(pushToast(`Coupon ${result.payload.code} applied!`));
      setCode("");
    } else {
      dispatch(pushToast(result.payload || "Invalid coupon", "error"));
    }
  };

  return (
    <div className="card h-fit p-6 lg:sticky lg:top-24">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="eyebrow">Your Order</p>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ background: "var(--bg-raised)", color: "var(--ink-muted)" }}
        >
          {itemCount} {itemCount === 1 ? "Item" : "Items"}
        </span>
      </div>
      <h2 className="font-display text-2xl font-medium">Order Summary</h2>
      <p className="mb-5 text-xs" style={{ color: "var(--ink-muted)" }}>
        Total {itemCount} {itemCount === 1 ? "item" : "items"} ({unitCount}{" "}
        unit{unitCount === 1 ? "" : "s"})
      </p>

      {/* Items */}
      <div
        className="space-y-4 border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          const img = product.images?.desktop?.[0];
          return (
            <div key={product._id} className="flex items-center gap-3">
              <Link
                to={`/product/${product._id}`}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"
                style={{ background: "var(--bg-raised)" }}
              >
                {img && (
                  <img
                    src={getAssetUrl(img)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-medium leading-snug">
                  {product.name}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {formatCurrency(product.discountPrice || product.price)} ×{" "}
                  {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold">
                {formatCurrency(
                  (product.discountPrice || product.price) * item.quantity,
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div
        className="mt-5 space-y-2.5 border-t pt-4 text-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex justify-between">
          <span style={{ color: "var(--ink-muted)" }}>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between" style={{ color: "var(--success)" }}>
            <span>Coupon discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: "var(--ink-muted)" }}>Shipping Fee</span>
          <span
            className="font-bold"
            style={{ color: shipping === 0 ? "var(--success)" : "var(--ink)" }}
          >
            {shipping === 0 ? "FREE" : formatCurrency(shipping)}
          </span>
        </div>
      </div>

      {/* Total payable */}
      <div
        className="mt-4 border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        <p
          className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--ink-faint)" }}
        >
          Total Payable
        </p>
        <div className="flex items-end justify-between">
          <p className="font-display text-xl font-medium">Grand Total</p>
          <p
            className="font-display text-[26px] font-medium leading-none"
            style={{ color: "var(--accent)" }}
          >
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {/* Compact promo (agar cart me apply nahi kiya) */}
      {!coupon ? (
        <form className="mt-5 flex gap-2" onSubmit={handleApply}>
          <input
            className="field flex-1 py-2.5! text-sm uppercase"
            placeholder="Promo code e.g. 'NIYA10'"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Promo code"
          />
          <button
            className="btn btn-outline shrink-0 px-4! py-2! text-[11px]!"
            type="submit"
            disabled={applying}
          >
            {applying ? <SpinnerIcon size={13} /> : "Apply"}
          </button>
        </form>
      ) : (
        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs"
          style={{
            background: "var(--accent-soft)",
            border: "1px dashed var(--accent)",
          }}
        >
          <span className="flex items-center gap-2">
            <TagIcon size={14} style={{ color: "var(--accent)" }} />
            <b>{coupon.code}</b> applied
          </span>
          <button
            className="shrink-0 font-bold underline"
            onClick={() => {
              dispatch(clearCoupon());
              dispatch(pushToast("Coupon removed", "info"));
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* CTA */}
      <button
        className="btn btn-accent mt-6 w-full rounded-xl!"
        disabled={placing || !canPlace}
        onClick={onPlace}
      >
        {placing ? (
          <>
            <SpinnerIcon size={15} /> Placing Order…
          </>
        ) : (
          <>
            Confirm &amp; Place Order <ArrowRightIcon size={15} />
          </>
        )}
      </button>

      {/* Terms note */}
      <p
        className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed"
        style={{ color: "var(--ink-muted)" }}
      >
        <ShieldIcon
          size={14}
          className="mt-px shrink-0"
          style={{ color: "var(--success)" }}
        />
        By placing your order, you agree to Niya Bags' terms of service and
        delivery policy.
      </p>

      {/* Secure checkout footer */}
      <div
        className="mt-5 border-t pt-4 text-center"
        style={{ borderColor: "var(--border)" }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--ink-muted)" }}
        >
          Secure Checkout
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--ink-faint)" }}>
          Your order details are handled securely.
        </p>
      </div>
    </div>
  );
}
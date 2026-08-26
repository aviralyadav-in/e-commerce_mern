import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyCoupon, clearCoupon } from "../../features/cart/cartSlice";
import { pushToast } from "../../features/ui/uiSlice";
import { formatCurrency } from "../../utils/format";
import { calcShipping } from "../../utils/shipping";
import { TagIcon, LockIcon, ArrowRightIcon, SpinnerIcon } from "../common/Icons";

/**
 * Cart page ka right-side "ORDER BREAKDOWN" panel —
 * totals, gold serif Grand Total, promo code aur Proceed CTA.
 */
export default function OrderBreakdown({ onProceed, proceeding = false }) {
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
      <p className="eyebrow mb-5">Order Breakdown</p>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span style={{ color: "var(--ink-muted)" }}>Total Products</span>
          <span className="font-semibold">
            {itemCount} {itemCount === 1 ? "Item" : "Items"}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "var(--ink-muted)" }}>Total Units</span>
          <span className="font-semibold">{unitCount} Pieces</span>
        </div>
        <div
          className="border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        />
        <div className="flex justify-between">
          <span style={{ color: "var(--ink-muted)" }}>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between" style={{ color: "var(--success)" }}>
            <span>Coupon ({coupon.code})</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: "var(--ink-muted)" }}>Estimated Shipping</span>
          <span
            className="font-bold"
            style={{ color: shipping === 0 ? "var(--success)" : "var(--ink)" }}
          >
            {shipping === 0 ? "FREE" : formatCurrency(shipping)}
          </span>
        </div>
      </div>

      {/* Grand Total */}
      <div
        className="mt-5 flex items-end justify-between gap-3 border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <p className="font-display text-xl font-medium">Grand Total</p>
          <p className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Includes all taxes
          </p>
        </div>
        <p
          className="font-display text-[26px] font-medium leading-none"
          style={{ color: "var(--accent)" }}
        >
          {formatCurrency(total)}
        </p>
      </div>

      {/* Promo / Gift code */}
      <p
        className="mb-2 mt-6 text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color: "var(--ink-muted)" }}
      >
        Promo / Gift Code
      </p>
      {coupon ? (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs"
          style={{
            background: "var(--accent-soft)",
            border: "1px dashed var(--accent)",
          }}
        >
          <span className="flex items-center gap-2">
            <TagIcon size={14} style={{ color: "var(--accent)" }} />
            <b>{coupon.code}</b> — saved {formatCurrency(coupon.discountAmount)}
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
      ) : (
        <form className="flex gap-2" onSubmit={handleApply}>
          <input
            className="field flex-1 py-2.5! text-sm uppercase"
            placeholder={`TRY 'NIYA10'`}
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
      )}

      {/* CTA */}
      <button
        className="btn mt-6 w-full justify-between rounded-xl! px-5!"
        style={{
          border: "1px solid var(--border-strong)",
          color: "var(--ink)",
          background: "transparent",
        }}
        disabled={proceeding}
        onClick={onProceed}
      >
        Proceed to Order
        <ArrowRightIcon size={15} />
      </button>

      <p
        className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px]"
        style={{ color: "var(--ink-faint)" }}
      >
        <LockIcon size={12} />
        Safe &amp; Encrypted Checkout • Complimentary Shipping
      </p>
    </div>
  );
}
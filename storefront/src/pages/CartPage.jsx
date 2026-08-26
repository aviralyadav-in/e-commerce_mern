import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, setItemQuantity } from "../features/cart/cartSlice";
import { pushToast } from "../features/ui/uiSlice";
import { getAssetUrl } from "../utils/assetUrl";
import {
  effectivePrice,
  formatCurrency,
  productImage,
  titleCase,
} from "../utils/format";
import { FREE_SHIP_THRESHOLD } from "../utils/shipping";
import QuantityStepper from "../components/common/QuantityStepper";
import OrderBreakdown from "../components/cart/OrderBreakdown";
import { TrashIcon, TruckIcon, BagIcon } from "../components/common/Icons";

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useSelector((s) => s.cart);

  const items = cart?.items || [];
  const subtotal = cart?.totalPrice || 0;
  const unitCount = items.reduce((n, i) => n + (i.quantity || 0), 0);

  // Free shipping progress bar
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const freeUnlocked = remaining === 0 && subtotal > 0;
  const progress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIP_THRESHOLD) * 100),
  );

  const handleRemove = (product) => {
    dispatch(removeFromCart(product._id));
    dispatch(pushToast(`${product.name} removed from bag`, "info"));
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-28 text-center sm:px-6">
        <p className="eyebrow mb-3">Your Selection</p>
        <h1 className="section-title">Shopping Bag</h1>
        <div
          className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--bg-raised)", color: "var(--ink-faint)" }}
        >
          <BagIcon size={30} />
        </div>
        <p className="mt-6 text-sm" style={{ color: "var(--ink-muted)" }}>
          Your bag is waiting to be filled with timeless pieces.
        </p>
        <Link to="/shop" className="btn btn-accent mt-8">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Centered page header */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow mb-3">Your Selection</p>
        <h1 className="section-title">Shopping Bag</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
          Handcrafted luxury pieces chosen to become part of your story.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div>
          {/* Free shipping progress */}
          <div className="card mb-4 px-5 py-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span
                className="flex items-center gap-2 text-xs font-semibold"
                style={{ color: "var(--ink)" }}
              >
                <TruckIcon size={16} style={{ color: "var(--accent)" }} />
                {freeUnlocked
                  ? "Free shipping unlocked!"
                  : `Add ${formatCurrency(remaining)} more for FREE shipping`}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--accent)" }}
              >
                3–5 Days
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--bg-raised)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px]" style={{ color: "var(--ink-faint)" }}>
                Shipping progress
              </span>
              <span
                className="text-[9px] font-bold"
                style={{ color: "var(--accent)" }}
              >
                {progress}%
              </span>
            </div>
          </div>

          {/* Unlocked strip */}
          {freeUnlocked && (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-xl px-5 py-4"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="flex items-center gap-2.5 text-sm">
                <TruckIcon size={17} style={{ color: "var(--accent)" }} />
                <span>
                  <b>Free Domestic Shipping</b> on your selection!
                </span>
              </span>
              <span
                className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--accent)" }}
              >
                3–5 Days Delivery
              </span>
            </div>
          )}

          {/* Bag items */}
          <div className="card overflow-hidden">
            <div className="flex items-end justify-between px-5 pb-3 pt-5">
              <div>
                <p className="eyebrow mb-1">Bag Items</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Total {items.length} {items.length === 1 ? "item" : "items"} (
                  {unitCount} unit{unitCount === 1 ? "" : "s"})
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold tracking-wide"
                style={{ color: "var(--accent)" }}
              >
                + Add More
              </Link>
            </div>

            <div>
              {items.map((item, idx) => {
                const product = item.product;
                if (!product) return null;
                const price = effectivePrice(product);
                return (
                  <div
                    key={product._id}
                    className="flex gap-4 px-5 py-5"
                    style={
                      idx > 0
                        ? { borderTop: "1px solid var(--border)" }
                        : undefined
                    }
                  >
                    <Link
                      to={`/product/${product._id}`}
                      className="h-28 w-24 shrink-0 overflow-hidden rounded-lg"
                      style={{ background: "var(--bg-raised)" }}
                    >
                      {productImage(product) && (
                        <img
                          src={getAssetUrl(productImage(product))}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="eyebrow mb-0.5"
                            style={{ fontSize: 9 }}
                          >
                            {titleCase(product.categoryId?.name)}
                          </p>
                          <Link
                            to={`/product/${product._id}`}
                            className="block truncate font-display text-lg font-medium hover:opacity-80"
                          >
                            {product.name}
                          </Link>
                          <p
                            className="mt-0.5 text-sm"
                            style={{ color: "var(--ink-muted)" }}
                          >
                            {formatCurrency(price)} each
                          </p>
                        </div>
                        <p className="shrink-0 whitespace-nowrap font-bold">
                          {formatCurrency(price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center gap-4 pt-3">
                        <QuantityStepper
                          value={item.quantity}
                          max={Math.max(1, Math.min(product.stock || 10, 10))}
                          onChange={(quantity) =>
                            dispatch(
                              setItemQuantity({
                                productId: product._id,
                                quantity,
                              }),
                            )
                          }
                        />
                        <button
                          className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                          style={{ color: "var(--danger)" }}
                          disabled={loading}
                          onClick={() => handleRemove(product)}
                        >
                          <TrashIcon size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — Order Breakdown */}
        <aside>
          <OrderBreakdown
            onProceed={() => navigate("/checkout")}
            proceeding={loading}
          />
        </aside>
      </div>
    </div>
  );
}

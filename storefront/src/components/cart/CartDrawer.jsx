import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { closeCart } from "../../features/ui/uiSlice";
import { removeFromCart, setItemQuantity } from "../../features/cart/cartSlice";
import { getAssetUrl } from "../../utils/assetUrl";
import {
  effectivePrice,
  formatCurrency,
  productImage,
} from "../../utils/format";
import QuantityStepper from "../common/QuantityStepper";
import { BagIcon, CloseIcon, TrashIcon } from "../common/Icons";

/** Slide-over cart drawer */
export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((state) => state.ui.cartOpen);
  const { cart, loading } = useSelector((state) => state.cart);
  const items = cart?.items || [];
  const subtotal = cart?.totalPrice || 0;

  if (!open) return null;

  const go = (path) => {
    dispatch(closeCart());
    navigate(path);
  };

  return (
    <>
      <div className="overlay" onClick={() => dispatch(closeCart())} />
      <aside className="drawer" aria-label="Shopping bag">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-display text-xl font-semibold">
            Your Bag{" "}
            <span
              className="text-sm font-normal"
              style={{ color: "var(--ink-muted)" }}
            >
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <button
            className="icon-btn"
            aria-label="Close bag"
            onClick={() => dispatch(closeCart())}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!items.length && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <BagIcon size={44} style={{ color: "var(--ink-faint)" }} />
              <p style={{ color: "var(--ink-muted)" }}>Your bag is empty.</p>
              <button className="btn btn-accent" onClick={() => go("/shop")}>
                Start Shopping
              </button>
            </div>
          )}

          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div
                key={product._id}
                className="flex gap-3 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <button
                  className="h-24 w-20 shrink-0 overflow-hidden rounded-lg"
                  style={{ background: "var(--bg-raised)" }}
                  onClick={() => go(`/product/${product._id}`)}
                >
                  {productImage(product) && (
                    <img
                      src={getAssetUrl(productImage(product))}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {product.name}
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    {formatCurrency(effectivePrice(product))}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <QuantityStepper
                      small
                      value={item.quantity}
                      max={product.stock || 10}
                      onChange={(qty) =>
                        dispatch(
                          setItemQuantity({
                            productId: product._id,
                            quantity: qty,
                          }),
                        )
                      }
                    />
                    <button
                      aria-label="Remove item"
                      className="icon-btn h-8! w-8!"
                      disabled={loading}
                      onClick={() => dispatch(removeFromCart(product._id))}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <div
            className="px-5 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="mb-3 flex items-center justify-between text-sm">
              <span style={{ color: "var(--ink-muted)" }}>Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <p className="mb-3 text-xs" style={{ color: "var(--ink-faint)" }}>
              {subtotal > 500
                ? "🎉 You've unlocked FREE shipping!"
                : `Add ${formatCurrency(500 - subtotal)} more for FREE shipping`}
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-outline flex-1"
                onClick={() => go("/cart")}
              >
                View Bag
              </button>
              <button
                className="btn btn-accent flex-1"
                onClick={() => go("/checkout")}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

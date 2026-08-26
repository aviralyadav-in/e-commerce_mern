import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderById,
  clearCurrentOrder,
} from "../features/orders/ordersSlice";
import { getAssetUrl } from "../utils/assetUrl";
import {
  formatCurrency,
  formatDateTime,
  productImage,
  titleCase,
} from "../utils/format";
import {
  CheckIcon,
  SpinnerIcon,
  PackageIcon,
  MapPinIcon,
} from "../components/common/Icons";

const STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { current: order } = useSelector((s) => s.orders);
  const justPlaced = searchParams.get("placed") === "1";

  useEffect(() => {
    dispatch(fetchOrderById(id));
    return () => dispatch(clearCurrentOrder());
  }, [dispatch, id]);

  if (!order) {
    return (
      <div className="flex items-center justify-center py-40">
        <SpinnerIcon size={28} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.orderStatus);
  const addr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {justPlaced && (
        <div
          className="mb-8 flex items-center gap-3 rounded-2xl p-5"
          style={{
            background: "var(--accent-soft)",
            border: "1px dashed var(--accent)",
          }}
        >
          <CheckIcon size={22} style={{ color: "var(--success)" }} />
          <div>
            <p className="font-semibold">Thank you! Your order is confirmed.</p>
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
              We've started preparing your bags for dispatch.
            </p>
          </div>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow">Order Details</p>
        <Link
          to="/orders"
          className="text-xs font-semibold underline"
          style={{ color: "var(--ink-muted)" }}
        >
          All Orders
        </Link>
      </div>
      <h1 className="section-title mb-1 text-3xl!">
        #{order._id.slice(-8).toUpperCase()}
      </h1>
      <p className="mb-8 text-xs" style={{ color: "var(--ink-muted)" }}>
        Placed {formatDateTime(order.createdAt)}
      </p>

      {/* Status timeline */}
      <div className="card mb-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className={`status-pill status-${order.orderStatus}`}>
            {order.orderStatus}
          </span>
          <span className={`status-pill status-${order.paymentStatus}`}>
            Payment: {order.paymentStatus}
          </span>
          <span className="text-sm font-semibold">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
        {order.orderStatus !== "Cancelled" && (
          <div className="mt-6 flex items-center">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className="flex flex-1 items-center last:flex-none"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background:
                        i <= stepIndex ? "var(--accent)" : "var(--bg-raised)",
                      color: i <= stepIndex ? "#101d1d" : "var(--ink-faint)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        i <= stepIndex ? "var(--accent)" : "var(--ink-faint)",
                    }}
                  >
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className="mx-2 mb-5 h-0.5 flex-1"
                    style={{
                      background:
                        i < stepIndex ? "var(--accent)" : "var(--border)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Items */}
        <div>
          {order.orderItems.map((item, index) => {
            const product = item.product;
            const img = product ? productImage(product) : "";
            return (
              <div
                key={index}
                className="card mb-3 flex items-center gap-4 p-4"
              >
                <div
                  className="h-20 w-16 shrink-0 overflow-hidden rounded-lg"
                  style={{ background: "var(--bg-raised)" }}
                >
                  {img && (
                    <img
                      src={getAssetUrl(img)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {product?._id ? (
                    <Link
                      to={`/product/${product._id}`}
                      className="font-semibold hover:text-(--accent)"
                    >
                      {product.name}
                    </Link>
                  ) : (
                    <p className="font-semibold">Product</p>
                  )}
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    {product?.categoryId?.name &&
                      titleCase(product.categoryId.name) + " · "}
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-bold">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Address + totals */}
        <div className="space-y-6">
          {addr && (
            <div className="card p-5">
              <p className="eyebrow mb-3">Shipping To</p>
              <p className="text-sm font-semibold">{addr.full_name}</p>
              <p
                className="mt-1 flex gap-1.5 text-sm leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                <MapPinIcon size={15} className="mt-0.5 shrink-0" />
                {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
                Phone: {addr.phone}
              </p>
            </div>
          )}

          <div className="card p-5">
            <p className="eyebrow mb-3">Bill Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-muted)" }}>Items</span>
                <span>{formatCurrency(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-muted)" }}>Shipping</span>
                <span>
                  {order.shippingPrice === 0
                    ? "FREE"
                    : formatCurrency(order.shippingPrice)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div
                  className="flex justify-between"
                  style={{ color: "var(--success)" }}
                >
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div
                className="flex justify-between border-t pt-2 font-bold"
                style={{ borderColor: "var(--border)" }}
              >
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <p className="pt-1 text-xs" style={{ color: "var(--ink-faint)" }}>
                Paid via {order.paymentMethod}
              </p>
            </div>
          </div>
        </div>
      </div>

      {order.orderStatus === "Delivered" && (
        <div
          className="mt-8 flex items-center gap-3 rounded-xl p-4 text-sm"
          style={{ background: "var(--accent-soft)", color: "var(--ink)" }}
        >
          <PackageIcon size={18} style={{ color: "var(--accent)" }} />
          Delivered on {formatDateTime(order.deliveredAt)} — we hope you love
          your bags!
        </div>
      )}
    </div>
  );
}

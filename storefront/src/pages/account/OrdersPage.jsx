import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronDown, Check, MapPin, Receipt, XCircle, Truck } from "lucide-react";
import { api } from "../../lib/api";
import { cn, formatCurrency, formatDate, getProductImages, pluralize, FALLBACK_BAG_IMAGE } from "../../lib/utils";
import usePageTitle from "../../hooks/usePageTitle";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import ImageWithFallback from "../../components/common/ImageWithFallback";

const TIMELINE_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];
const MAX_THUMBS = 4;

const PAYMENT_LABELS = {
  COD: "Cash on delivery",
  Card: "Card",
  UPI: "UPI",
};

function shortId(id) {
  return String(id || "").slice(-8).toUpperCase();
}

function getItemProduct(item) {
  return item?.product && typeof item.product === "object" ? item.product : null;
}

/**
 * First product image for an order line. When the product has no images at all
 * we pass `undefined` so ImageWithFallback resolves the local placeholder directly
 * instead of prefixing it with the API host (which 404s).
 */
function getItemThumb(item) {
  const src = getProductImages(getItemProduct(item), item?.variantName)[0];
  return src === FALLBACK_BAG_IMAGE ? undefined : src;
}

function OrderSkeleton() {
  return (
    <li className="surface-card p-5 sm:p-6" aria-hidden="true">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-3 w-24 rounded-full" />
          <div className="skeleton-shimmer h-5 w-40 rounded-full" />
          <div className="skeleton-shimmer h-3 w-32 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-7 w-24 rounded-full" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="skeleton-shimmer size-14 rounded-xl" />
        <div className="skeleton-shimmer size-14 rounded-xl" />
        <div className="skeleton-shimmer h-3 w-28 rounded-full" />
      </div>
    </li>
  );
}

function OrderTimeline({ status, deliveredAt }) {
  const currentIndex = TIMELINE_STEPS.indexOf(status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div>
      <ol className="grid grid-cols-4 gap-1 sm:gap-2" aria-label="Order progress">
        {TIMELINE_STEPS.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          const upcoming = i > activeIndex;
          return (
            <li key={step} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-4 right-1/2 h-px w-full -translate-y-1/2",
                    done || current ? "bg-primary" : "bg-line-strong"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-champagne bg-champagne text-onyx ring-4 ring-champagne/25",
                  upcoming && "border-line-strong bg-surface text-ink-soft"
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 text-[11px] font-semibold leading-tight sm:text-small",
                  upcoming ? "text-ink-soft" : "text-foreground"
                )}
              >
                {step}
                {current && <span className="sr-only"> (current)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {status === "Delivered" && deliveredAt && (
        <p className="mt-3 text-center text-small text-ink-muted">
          Delivered on {formatDate(deliveredAt, "long")}
        </p>
      )}
    </div>
  );
}

function OrderCard({ order, expanded, onToggle }) {
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const itemCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const detailsId = `order-${order._id}-details`;
  const address = order.shippingAddress && typeof order.shippingAddress === "object" ? order.shippingAddress : null;
  const isCancelled = order.orderStatus === "Cancelled";

  const itemsTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);
  const itemsPrice = order.itemsPrice ?? itemsTotal;
  const shippingPrice = Number(order.shippingPrice) || 0;
  const codFee = Number(order.codFee) || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "—";

  const thumbs = items.slice(0, MAX_THUMBS);
  const extraCount = items.length - thumbs.length;

  return (
    <li className="surface-card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="text-micro text-ink-soft">Order</p>
            <h3 className="mt-0.5 font-sans text-lg font-semibold tracking-wide text-foreground">
              #{shortId(order._id)}
            </h3>
            <p className="mt-0.5 text-small text-ink-muted">Placed {formatDate(order.createdAt, "long")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.orderStatus} />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-micro text-ink-soft">Total</p>
            <p className="price mt-0.5 font-serif text-2xl text-foreground">{formatCurrency(order.totalAmount)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <ul className="flex items-center gap-2" aria-label="Items in this order">
              {thumbs.map((it, idx) => {
                const prod = getItemProduct(it);
                return (
                  <li key={`${order._id}-thumb-${idx}`}>
                    <ImageWithFallback
                      src={getItemThumb(it)}
                      alt={prod?.name || "Product"}
                      ratio="1/1"
                      className="size-14 rounded-xl border border-line"
                    />
                  </li>
                );
              })}
              {extraCount > 0 && (
                <li className="flex size-14 items-center justify-center rounded-xl border border-line bg-surface-2 text-small font-semibold text-ink-muted">
                  +{extraCount}
                </li>
              )}
            </ul>
            <p className="text-small text-ink-muted">
              {pluralize(itemCount, "item")} · {paymentLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={detailsId}
            className="btn btn-secondary btn-sm"
          >
            <span>{expanded ? "Hide details" : "View details"}</span>
            <ChevronDown
              className={cn("transition-transform duration-300", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={detailsId} className="animate-fade-in space-y-6 border-t border-line bg-surface-2 p-5 sm:p-6">
          {/* Progress */}
          <section aria-label="Order status" className="rounded-2xl border border-line bg-surface p-5">
            {isCancelled ? (
              <div className="flex items-start gap-3 rounded-xl bg-danger-soft px-4 py-3 text-danger">
                <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">This order was cancelled</p>
                  <p className="mt-0.5 text-small opacity-90">
                    Any payment already made will be refunded to the original method within 5–7 business days.
                  </p>
                </div>
              </div>
            ) : (
              <OrderTimeline status={order.orderStatus} deliveredAt={order.deliveredAt} />
            )}
          </section>

          {/* Items */}
          <section aria-label="Items" className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-small">
                <thead>
                  <tr className="border-b border-line text-left text-micro text-ink-soft">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Item
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold">
                      Qty
                    </th>
                    <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const prod = getItemProduct(it);
                    const qty = Number(it.quantity) || 0;
                    const price = Number(it.price) || 0;
                    return (
                      <tr key={`${order._id}-item-${idx}`} className="border-b border-line last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback
                              src={getItemThumb(it)}
                              alt=""
                              ratio="1/1"
                              className="size-12 shrink-0 rounded-lg border border-line"
                            />
                            <div className="min-w-0">
                              {prod?._id ? (
                                <Link
                                  to={`/product/${prod._id}`}
                                  className="line-clamp-2 font-serif text-[15px] font-medium text-foreground transition-colors hover:text-gold-ink"
                                >
                                  {prod.name || "Product"}
                                </Link>
                              ) : (
                                <span className="font-serif text-[15px] font-medium text-ink-muted">
                                  Product no longer available
                                </span>
                              )}
                              {it.variantName && (
                                <p className="text-micro mt-0.5 text-ink-soft">{it.variantName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="price px-4 py-3 text-center text-foreground">{qty}</td>
                        <td className="price hidden px-4 py-3 text-right text-ink-muted sm:table-cell">
                          {formatCurrency(price)}
                        </td>
                        <td className="price px-4 py-3 text-right text-foreground">{formatCurrency(price * qty)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Shipping address */}
            <section aria-labelledby={`${detailsId}-address`} className="rounded-2xl border border-line bg-surface p-5">
              <h4
                id={`${detailsId}-address`}
                className="flex items-center gap-2 font-sans text-micro text-ink-soft"
              >
                <MapPin className="size-3.5 text-gold-ink" aria-hidden="true" />
                Shipping address
              </h4>
              {address ? (
                <address className="mt-3 text-small not-italic leading-relaxed text-ink-muted">
                  <span className="block font-semibold text-foreground">
                    {[address.firstName, address.lastName].filter(Boolean).join(" ") || address.fullName}
                  </span>
                  <span className="block">{address.addressLine1}</span>
                  {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
                  {address.landmark && <span className="block">Near {address.landmark}</span>}
                  <span className="block">
                    {address.city}, {address.state} {address.zipCode}
                  </span>
                  {address.phone && <span className="mt-2 block">Phone: {address.phone}</span>}
                </address>
              ) : (
                <p className="mt-3 text-small text-ink-muted">Address details are unavailable for this order.</p>
              )}
            </section>

            {/* Price breakdown */}
            <section aria-labelledby={`${detailsId}-summary`} className="rounded-2xl border border-line bg-surface p-5">
              <h4
                id={`${detailsId}-summary`}
                className="flex items-center gap-2 font-sans text-micro text-ink-soft"
              >
                <Receipt className="size-3.5 text-gold-ink" aria-hidden="true" />
                Payment summary
              </h4>
              <dl className="mt-3 space-y-2 text-small">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-muted">Items ({pluralize(itemCount, "item")})</dt>
                  <dd className="price text-foreground">{formatCurrency(itemsPrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-muted">Shipping</dt>
                  <dd className={cn("price", shippingPrice === 0 ? "text-success" : "text-foreground")}>
                    {shippingPrice === 0 ? "Free" : formatCurrency(shippingPrice)}
                  </dd>
                </div>
                {codFee > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Cash on delivery fee</dt>
                    <dd className="price text-foreground">{formatCurrency(codFee)}</dd>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">
                      Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                    </dt>
                    <dd className="price text-success">−{formatCurrency(discountAmount)}</dd>
                  </div>
                )}
                <div className="hairline flex items-center justify-between gap-4 pt-2">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="price text-lg text-foreground">{formatCurrency(order.totalAmount)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <dt className="text-ink-muted">Paid via</dt>
                  <dd className="text-foreground">{paymentLabel}</dd>
                </div>
              </dl>
            </section>
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-muted">
            <Truck className="size-4 text-gold-ink" aria-hidden="true" />
            <span>Need help with this order?</span>
            <Link to="/contact" className="link-gold">
              Contact our concierge
            </Link>
          </p>
        </div>
      )}
    </li>
  );
}

export default function OrdersPage() {
  usePageTitle("My orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchMyOrders = async () => {
      try {
        const res = await api.get("/orders/my-orders");
        if (!ignore) setOrders(res.data?.orders || []);
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchMyOrders();
    return () => {
      ignore = true;
    };
  }, []);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  const toggleExpand = (id) => {
    setExpandedOrderId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Order history</h2>
          <p className="mt-1 text-small text-ink-muted" aria-live="polite">
            {loading
              ? "Fetching your orders…"
              : orders.length === 0
                ? "Every purchase will appear here."
                : `${pluralize(orders.length, "order")} placed with Niya Bags.`}
          </p>
        </div>
        {!loading && orders.length > 0 && (
          <Link to="/shop" className="btn btn-ghost btn-sm">
            Continue shopping
          </Link>
        )}
      </div>

      {loading ? (
        <ul className="space-y-4" aria-busy="true" aria-label="Loading orders">
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
        </ul>
      ) : sortedOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Your handcrafted pieces will appear here once you place an order."
          action={{ label: "Shop the collection", to: "/shop" }}
        />
      ) : (
        <ul className="space-y-4">
          {sortedOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              expanded={expandedOrderId === order._id}
              onToggle={() => toggleExpand(order._id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

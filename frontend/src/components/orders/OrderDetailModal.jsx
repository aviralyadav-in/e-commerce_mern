import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderById,
  clearSelectedOrder,
} from "../../features/orders/ordersSlice";
import Thumb from "../common/Thumb";
import { ORDER_STATUSES } from "../../utils/orderStatuses";
import {
  formatCurrency,
  formatDateTime,
  shortId,
  initials,
} from "../../utils/format";
import {
  AlertIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  TruckIcon,
  XIcon,
} from "../common/Icon";

const STATUS_BADGE = {
  Pending: "badge-warning",
  Processing: "badge-info",
  Shipped: "badge-brand",
  Delivered: "badge-success",
  Cancelled: "badge-danger",
};

const PAYMENT_BADGE = {
  Completed: "badge-success",
  Pending: "badge-warning",
  Failed: "badge-danger",
  Refunded: "badge-info",
};

/** Small labelled block used across the summary grid. */
const Cell = ({ label, children }) => (
  <div>
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-(--ink-faint) mb-1.5">
      {label}
    </p>
    {children}
  </div>
);

const OrderDetailModal = ({ isOpen, orderId, onClose }) => {
  const dispatch = useDispatch();
  const { selectedOrder, detailLoading, error } = useSelector(
    (state) => state.orders,
  );

  useEffect(() => {
    if (isOpen && orderId) {
      dispatch(fetchOrderById(orderId));
    }
    return () => {
      dispatch(clearSelectedOrder());
    };
  }, [isOpen, orderId, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const order = selectedOrder;
  const address = order?.shippingAddress;
  const cancelled = order?.orderStatus === "Cancelled";
  /** Pipeline stops before Cancelled — a cancelled order has no progress to show. */
  const pipeline = ORDER_STATUSES.slice(0, 4);
  const reachedIndex = cancelled
    ? -1
    : pipeline.indexOf(order?.orderStatus ?? "");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
      >
        <div className="drawer-header">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 shrink-0 rounded-(--radius) bg-(--brand-soft) text-(--brand) flex items-center justify-center">
              <TruckIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="drawer-title">
                Order {shortId(order?._id || orderId)}
              </h3>
              <p className="drawer-subtitle">
                {order
                  ? `Placed ${formatDateTime(order.createdAt)}`
                  : "Loading order…"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn icon-btn-ghost"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="drawer-body admin-scroll">
          {detailLoading && (
            <div className="flex flex-col items-center gap-2.5 py-14">
              <span className="spinner w-7 h-7 border-[3px]" />
              <p className="text-[12.5px] text-(--ink-muted)">
                Fetching order…
              </p>
            </div>
          )}

          {!detailLoading && error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-(--radius) bg-red-50 border border-red-200">
              <AlertIcon className="w-4 h-4 text-(--danger) shrink-0 mt-px" />
              <p className="text-[12.5px] text-red-700">{error}</p>
            </div>
          )}

          {!detailLoading && order && (
            <div className="space-y-5">
              {/* Fulfilment pipeline */}
              <div className="admin-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-(--ink-faint)">
                    Fulfilment
                  </p>
                  <span
                    className={`badge ${
                      STATUS_BADGE[order.orderStatus] || "badge-neutral"
                    }`}
                  >
                    <span className="badge-dot" />
                    {order.orderStatus}
                  </span>
                </div>

                {cancelled ? (
                  <p className="text-[12.5px] text-(--ink-muted)">
                    This order was cancelled, so it never moved through
                    fulfilment.
                  </p>
                ) : (
                  <div className="flex items-center">
                    {pipeline.map((step, i) => {
                      const done = i <= reachedIndex;
                      const current = i === reachedIndex;
                      return (
                        <Fragment key={step}>
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                done
                                  ? "bg-(--brand) border-(--brand) text-white"
                                  : "bg-white border-(--border-strong) text-(--ink-faint)"
                              }`}
                            >
                              {done ? (
                                <CheckIcon className="w-3.5 h-3.5" />
                              ) : (
                                i + 1
                              )}
                            </span>
                            <span
                              className={`text-[10.5px] whitespace-nowrap ${
                                current
                                  ? "font-bold text-(--ink)"
                                  : done
                                    ? "font-semibold text-(--ink-soft)"
                                    : "text-(--ink-faint)"
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                          {i < pipeline.length - 1 && (
                            <span
                              className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${
                                i < reachedIndex
                                  ? "bg-(--brand)"
                                  : "bg-(--border-strong)"
                              }`}
                            />
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer + payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Cell label="Customer">
                  <div className="flex items-center gap-2.5">
                    <span className="avatar w-9 h-9 text-[11.5px]">
                      {initials(order.user?.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-(--ink) truncate">
                        {order.user?.name || "Unknown"}
                      </p>
                      <p className="text-[11.5px] text-(--ink-muted) truncate">
                        {order.user?.email || "—"}
                      </p>
                    </div>
                  </div>
                </Cell>

                <Cell label="Payment">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-(--ink)">
                      {order.paymentMethod || "—"}
                    </span>
                    <span
                      className={`badge ${
                        PAYMENT_BADGE[order.paymentStatus] || "badge-neutral"
                      }`}
                    >
                      {order.paymentStatus || "Unknown"}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-(--ink-muted) mt-1">
                    {formatCurrency(order.totalAmount)} charged
                  </p>
                </Cell>
              </div>

              {/* Shipping address */}
              <Cell label="Shipping address">
                {address ? (
                  <div className="admin-card p-3.5 space-y-1">
                    <p className="text-[13px] font-semibold text-(--ink)">
                      {address.fullName ||
                        [address.firstName, address.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        "—"}
                    </p>
                    <p className="text-[12.5px] text-(--ink-soft) leading-relaxed">
                      {[
                        address.addressLine1,
                        address.addressLine2,
                        address.landmark,
                        address.city,
                        address.state,
                        address.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                    {address.phone && (
                      <p className="flex items-center gap-1.5 text-[12px] text-(--ink-muted) pt-0.5">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        {address.phone}
                      </p>
                    )}
                    {order.user?.email && (
                      <p className="flex items-center gap-1.5 text-[12px] text-(--ink-muted)">
                        <MailIcon className="w-3.5 h-3.5" />
                        {order.user.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-(--ink-faint)">
                    No address on this order.
                  </p>
                )}
              </Cell>

              {/* Items */}
              <Cell label={`Items (${order.orderItems?.length || 0})`}>
                <div className="space-y-2">
                  {(order.orderItems || []).map((item, idx) => {
                    const product = item.product;
                    const isObj = product && typeof product === "object";
                    const name = isObj ? product?.name : "Product";
                    const img = isObj
                      ? product?.images?.desktop?.[0] ||
                        product?.images?.mobile?.[0]
                      : null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-(--radius) border border-(--border) bg-white"
                      >
                        <Thumb src={img} alt={name} className="w-11 h-11" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-(--ink) truncate">
                            {name || "Product"}
                          </p>
                          <p className="text-[11.5px] text-(--ink-muted)">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-[13px] font-bold text-(--ink) shrink-0 tabular-nums">
                          {formatCurrency(
                            (item.price || 0) * (item.quantity || 0),
                          )}
                        </p>
                      </div>
                    );
                  })}
                  {!order.orderItems?.length && (
                    <p className="text-[12.5px] text-(--ink-faint)">
                      No line items recorded.
                    </p>
                  )}
                </div>
              </Cell>

              {/* Totals */}
              <div className="admin-card p-4 space-y-2 text-[12.5px]">
                <div className="flex justify-between text-(--ink-soft)">
                  <span>Items</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.itemsPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-(--ink-soft)">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {order.shippingPrice
                      ? formatCurrency(order.shippingPrice)
                      : "Free"}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-(--success)">
                    <span className="flex items-center gap-1.5">
                      Discount
                      {order.couponCode && (
                        <span className="code-chip">{order.couponCode}</span>
                      )}
                    </span>
                    <span className="tabular-nums">
                      −{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 mt-1 border-t border-(--border) text-[14px] font-bold text-(--ink)">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-(--ink-faint) font-mono break-all">
                {order._id}
              </p>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;

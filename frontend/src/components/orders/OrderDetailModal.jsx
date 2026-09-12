import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderById,
  clearSelectedOrder,
  updateOrderStatus,
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
  ClipboardIcon,
  MailIcon,
  PhoneIcon,
  PrinterIcon,
  TruckIcon,
  XIcon,
} from "../common/Icon";
import { notifySuccess, notifyError } from "../../lib/toast";

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

const PIPELINE_STEPS = [
  { key: "Pending", label: "Pending", hint: "Order Received" },
  { key: "Processing", label: "Processing", hint: "Packing Item" },
  { key: "Shipped", label: "Shipped", hint: "In Transit" },
  { key: "Delivered", label: "Delivered", hint: "Completed" },
];

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
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [updating, setUpdating] = useState(false);

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
  const pipelineKeys = PIPELINE_STEPS.map((s) => s.key);
  const reachedIndex = cancelled
    ? -1
    : pipelineKeys.indexOf(order?.orderStatus ?? "");

  const handleCopyOrderId = () => {
    if (!order?._id) return;
    navigator.clipboard.writeText(order._id);
    setCopiedId(true);
    notifySuccess("Order ID copied to clipboard", order._id);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyAddress = () => {
    if (!address) return;
    const name =
      address.fullName ||
      [address.firstName, address.lastName].filter(Boolean).join(" ");
    const lines = [
      name,
      address.phone ? `Phone: ${address.phone}` : null,
      [
        address.addressLine1,
        address.addressLine2,
        address.landmark,
        address.city,
        address.state,
        address.zipCode ? `- ${address.zipCode}` : null,
      ]
        .filter(Boolean)
        .join(", "),
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines);
    setCopiedAddr(true);
    notifySuccess("Shipping address copied", "Ready to paste in courier tool");
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!order?._id) return;
    setUpdating(true);
    try {
      await dispatch(
        updateOrderStatus({ id: order._id, orderStatus: newStatus }),
      ).unwrap();
    } catch (err) {
      notifyError("Failed to update status", err || "Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async (newPaymentStatus) => {
    if (!order?._id) return;
    setUpdating(true);
    try {
      await dispatch(
        updateOrderStatus({ id: order._id, paymentStatus: newPaymentStatus }),
      ).unwrap();
    } catch (err) {
      notifyError("Failed to update payment", err || "Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick next stage helper
  const getNextStage = () => {
    if (!order) return null;
    if (order.orderStatus === "Pending") return "Processing";
    if (order.orderStatus === "Processing") return "Shipped";
    if (order.orderStatus === "Shipped") return "Delivered";
    return null;
  };

  const nextStage = getNextStage();

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
              <div className="flex items-center gap-2">
                <h3 className="drawer-title">
                  Order {shortId(order?._id || orderId)}
                </h3>
                {order?._id && (
                  <button
                    type="button"
                    onClick={handleCopyOrderId}
                    className="p-1 rounded text-(--ink-faint) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
                    title={copiedId ? "Copied!" : "Copy full Order ID"}
                    aria-label="Copy full Order ID"
                  >
                    {copiedId ? (
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <ClipboardIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
              <p className="drawer-subtitle">
                {order
                  ? `Placed on ${formatDateTime(order.createdAt)}`
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
                Fetching order details…
              </p>
            </div>
          )}

          {!detailLoading && error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-(--radius) bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
              <AlertIcon className="w-4 h-4 text-(--danger) shrink-0 mt-px" />
              <p className="text-[12.5px] text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {!detailLoading && order && (
            <div className="space-y-5">
              {/* Fulfilment Pipeline Card */}
              <div className="admin-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-(--ink-faint)">
                      Fulfilment Stage
                    </p>
                    <p className="text-[12px] text-(--ink-muted) mt-0.5">
                      {order.deliveredAt
                        ? `Delivered on ${formatDate(order.deliveredAt)}`
                        : "Track delivery progress from store to customer doorstep"}
                    </p>
                  </div>
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
                  <div className="p-3 rounded-(--radius) bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-[12.5px]">
                    <p className="font-bold">This order was cancelled</p>
                    <p className="text-[11.5px] opacity-85 mt-0.5">
                      Stock has been returned to inventory and fulfilment
                      pipeline has stopped.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center py-2">
                      {PIPELINE_STEPS.map((step, i) => {
                        const done = i <= reachedIndex;
                        const current = i === reachedIndex;
                        return (
                          <Fragment key={step.key}>
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                                  done
                                    ? "bg-(--brand) border-(--brand) text-white shadow-xs"
                                    : "bg-(--surface-sunken) border-(--border-strong) text-(--ink-faint)"
                                }`}
                              >
                                {done ? (
                                  <CheckIcon className="w-4 h-4" />
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <span
                                className={`text-[11px] whitespace-nowrap mt-1 ${
                                  current
                                    ? "font-bold text-(--ink)"
                                    : done
                                      ? "font-semibold text-(--ink-soft)"
                                      : "text-(--ink-faint)"
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="text-[9.5px] text-(--ink-faint) whitespace-nowrap">
                                {step.hint}
                              </span>
                            </div>
                            {i < PIPELINE_STEPS.length - 1 && (
                              <span
                                className={`flex-1 h-0.5 mx-2 mb-6 rounded-full transition-all ${
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

                    {/* Quick Fulfilment Action Ribbon */}
                    <div className="mt-4 pt-3 border-t border-(--border) flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-(--ink-muted) font-medium">
                          Update Stage:
                        </span>
                        <select
                          disabled={updating || order.orderStatus === "Delivered"}
                          value={order.orderStatus}
                          title={
                            order.orderStatus === "Delivered"
                              ? "Delivered orders cannot be moved back"
                              : "Update fulfilment stage"
                          }
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="px-2.5 py-1 rounded-(--radius) text-[12px] font-semibold border border-(--border) bg-(--surface-card) text-(--ink) outline-none cursor-pointer hover:border-(--brand) transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option
                              key={st}
                              value={st}
                              className="bg-(--surface-card) text-(--ink)"
                            >
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {nextStage && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleUpdateStatus(nextStage)}
                          className="btn btn-primary text-[12px] py-1 px-3 shadow-xs"
                        >
                          Advance to {nextStage} &rarr;
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Customer & Payment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Cell label="Customer">
                  <div className="flex items-center gap-2.5 p-3 rounded-(--radius) border border-(--border) bg-(--surface-card)">
                    <span className="avatar w-9 h-9 text-[11.5px] shrink-0">
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
                  <div className="p-3 rounded-(--radius) border border-(--border) bg-(--surface-card)">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-(--ink)">
                        {order.paymentMethod || "Online"}
                      </span>
                      <select
                        disabled={updating}
                        value={order.paymentStatus || "Pending"}
                        onChange={(e) => handleUpdatePayment(e.target.value)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border outline-none cursor-pointer ${
                          PAYMENT_BADGE[order.paymentStatus]
                            ? `badge ${PAYMENT_BADGE[order.paymentStatus]}`
                            : "border-(--border) bg-(--surface-sunken) text-(--ink)"
                        }`}
                      >
                        {["Pending", "Completed", "Failed", "Refunded"].map(
                          (ps) => (
                            <option
                              key={ps}
                              value={ps}
                              className="bg-(--surface-card) text-(--ink)"
                            >
                              {ps}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <p className="text-[11.5px] text-(--ink-muted) mt-1">
                      {formatCurrency(order.totalAmount)} total charged
                    </p>
                    {order.transactionId && (
                      <div className="flex items-center justify-between gap-1.5 mt-1.5 pt-1.5 border-t border-(--border) text-[11px]">
                        <span className="text-(--ink-muted)">Txn ID:</span>
                        <span className="font-mono text-(--ink) font-medium select-all truncate">
                          {order.transactionId}
                        </span>
                      </div>
                    )}
                  </div>
                </Cell>
              </div>

              {/* Shipping Address */}
              <Cell label="Shipping Address">
                {address ? (
                  <div className="admin-card p-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-bold text-(--ink)">
                        {address.fullName ||
                          [address.firstName, address.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          "—"}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold text-(--brand) hover:bg-(--brand-soft) transition-colors cursor-pointer"
                        title="Copy formatted address to clipboard"
                      >
                        {copiedAddr ? (
                          <>
                            <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <ClipboardIcon className="w-3.5 h-3.5" />
                            <span>Copy Address</span>
                          </>
                        )}
                      </button>
                    </div>
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
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      {address.phone && (
                        <p className="flex items-center gap-1.5 text-[12px] text-(--ink-muted)">
                          <PhoneIcon className="w-3.5 h-3.5 text-(--ink-faint)" />
                          {address.phone}
                        </p>
                      )}
                      {order.user?.email && (
                        <p className="flex items-center gap-1.5 text-[12px] text-(--ink-muted)">
                          <MailIcon className="w-3.5 h-3.5 text-(--ink-faint)" />
                          {order.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12.5px] text-(--ink-faint)">
                    No address recorded on this order.
                  </p>
                )}
              </Cell>

              {/* Items List */}
              <Cell label={`Ordered Items (${order.orderItems?.length || 0})`}>
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
                        className="flex items-center gap-3 p-2.5 rounded-(--radius) border border-(--border) bg-(--surface-card) hover:bg-(--surface-sunken)/40 transition-colors"
                      >
                        <Thumb
                          src={img}
                          alt={name}
                          className="w-12 h-12 shrink-0 rounded-(--radius-sm)"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-(--ink) truncate">
                            {name || "Product"}
                          </p>
                          <p className="text-[11.5px] text-(--ink-muted)">
                            {formatCurrency(item.price)} &times; {item.quantity}
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

              {/* Pricing Totals Breakdown */}
              <div className="admin-card p-4 space-y-2 text-[12.5px]">
                <div className="flex justify-between text-(--ink-soft)">
                  <span>Items Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.itemsPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-(--ink-soft)">
                  <span>Shipping Fee</span>
                  <span className="tabular-nums">
                    {order.shippingPrice
                      ? formatCurrency(order.shippingPrice)
                      : "Free (₹0)"}
                  </span>
                </div>
                {order.codFee > 0 && (
                  <div className="flex justify-between text-(--ink-soft)">
                    <span>COD Convenience Fee</span>
                    <span className="tabular-nums">
                      {formatCurrency(order.codFee)}
                    </span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-(--success)">
                    <span className="flex items-center gap-1.5">
                      Coupon Discount
                      {order.couponCode && (
                        <span className="code-chip">{order.couponCode}</span>
                      )}
                    </span>
                    <span className="tabular-nums font-semibold">
                      −{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 mt-1 border-t border-(--border) text-[14px] font-bold text-(--ink)">
                  <span>Total Amount Charged</span>
                  <span className="tabular-nums text-[15px] text-(--brand)">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-(--ink-faint) font-mono break-all text-center">
                Ref ID: {order._id}
              </p>
            </div>
          )}
        </div>

        <div className="drawer-footer flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary text-[12.5px]"
            title="Print packing slip or invoice"
          >
            <PrinterIcon className="w-4 h-4 text-(--ink-muted)" />
            Print Packing Slip
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;

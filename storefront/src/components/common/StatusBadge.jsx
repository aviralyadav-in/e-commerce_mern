import React from "react";
import { cn } from "../../lib/utils";

const ORDER = {
  pending: { cls: "pill-warning", label: "Pending" },
  processing: { cls: "pill-gold", label: "Processing" },
  shipped: { cls: "pill-gold", label: "Shipped" },
  delivered: { cls: "pill-success", label: "Delivered" },
  cancelled: { cls: "pill-danger", label: "Cancelled" },
};

const PAYMENT = {
  pending: { cls: "pill-warning", label: "Payment pending" },
  completed: { cls: "pill-success", label: "Paid" },
  refunded: { cls: "pill-muted", label: "Refunded" },
  failed: { cls: "pill-danger", label: "Payment failed" },
};

/**
 * Order / payment status pill with consistent colours in both themes.
 * props: status (string), type "order" | "payment", withDot, className
 */
export default function StatusBadge({ status, type = "order", withDot = true, className }) {
  const key = String(status || "").toLowerCase();
  const map = type === "payment" ? PAYMENT : ORDER;
  const entry = map[key] || { cls: "pill-muted", label: status || "Unknown" };
  return (
    <span className={cn("pill", entry.cls, className)}>
      {withDot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />}
      {entry.label}
    </span>
  );
}

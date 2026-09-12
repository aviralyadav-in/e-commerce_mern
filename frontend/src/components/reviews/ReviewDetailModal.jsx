import { useEffect } from "react";
import Thumb from "../common/Thumb";
import { formatDate, initials } from "../../utils/format";
import { StarRow } from "./ReviewTable";
import {
  CheckIcon,
  EyeOffIcon,
  TrashIcon,
  XIcon,
  MessageSquareIcon,
} from "../common/Icon";

const ReviewDetailModal = ({
  isOpen,
  review,
  onClose,
  onApprove,
  onHide,
  onDelete,
}) => {
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

  if (!isOpen || !review) return null;

  const productImg =
    review.product?.images?.desktop?.[0] ||
    review.product?.images?.mobile?.[0];

  const status = review.status || "Pending";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Review details"
      >
        <div className="drawer-header">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-8 h-8 shrink-0 rounded-(--radius) bg-(--brand-soft) text-(--brand) flex items-center justify-center">
              <MessageSquareIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="drawer-title">Review Moderation</h3>
              <p className="drawer-subtitle">
                Submitted on {formatDate(review.createdAt)}
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

        <div className="drawer-body admin-scroll space-y-4">
          {/* Customer & Product Info Card */}
          <div className="p-3.5 rounded-(--radius) border border-(--border) bg-(--surface-card) space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-[12px] flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-xs">
                {initials(review.user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-bold text-(--ink) truncate">
                    {review.user?.name || "Customer"}
                  </p>
                  {review.verifiedPurchase && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0"
                      title="Verified Buyer (Ordered through store)"
                    >
                      ✓ Verified Buyer
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-(--ink-muted) truncate">
                  {review.user?.email || "—"}
                </p>
              </div>
              <span
                className={`badge shrink-0 ${
                  status === "Approved"
                    ? "badge-success"
                    : status === "Pending"
                      ? "badge-warning"
                      : "badge-neutral"
                }`}
              >
                <span className="badge-dot" />
                {status}
              </span>
            </div>

            <div className="pt-2 border-t border-(--border) flex items-center gap-3">
              <Thumb
                src={productImg}
                alt={review.product?.name}
                className="w-10 h-10 shrink-0"
                rounded="rounded-(--radius-sm)"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-(--ink-faint)">
                  Reviewed Product
                </p>
                <p className="text-[12.5px] font-semibold text-(--ink) truncate">
                  {review.product?.name || "Product Item"}
                </p>
              </div>
            </div>
          </div>

          {/* Rating & Comment Card */}
          <div className="p-4 rounded-(--radius) border border-(--border) bg-(--surface-card) space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRow rating={review.rating} size="w-4 h-4" />
                <span className="text-[13px] font-bold text-(--ink)">
                  {review.rating} out of 5 stars
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-(--border)">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-(--ink-faint) mb-1">
                Customer Feedback:
              </p>
              <p className="text-[13.5px] text-(--ink) leading-relaxed bg-(--surface-sunken)/40 p-3 rounded-(--radius) border border-(--border)">
                &ldquo;{review.comment || review.review || "No written comment provided."}&rdquo;
              </p>
            </div>
          </div>

          {/* Moderation Guidance */}
          <div className="p-3 rounded-(--radius) bg-(--surface-sunken) text-[11.5px] text-(--ink-muted) leading-relaxed">
            {status === "Approved" ? (
              <p>
                ✓ This review is currently <b>LIVE</b> on the product page and included in the product&apos;s star rating.
              </p>
            ) : status === "Pending" ? (
              <p>
                ⏳ This review is <b>PENDING</b>. Customers cannot see it until you approve it.
              </p>
            ) : (
              <p>
                🙈 This review is <b>HIDDEN</b> from the product page. You can re-approve it anytime.
              </p>
            )}
          </div>
        </div>

        <div className="drawer-footer flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(review)}
            className="btn text-(--danger) hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[12px]"
            title="Permanently remove review"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            {status !== "Approved" && (
              <button
                type="button"
                onClick={() => onApprove(review)}
                className="btn btn-primary text-[12px]"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Approve (Make Live)
              </button>
            )}
            {status !== "Hidden" && (
              <button
                type="button"
                onClick={() => onHide(review)}
                className="btn btn-secondary text-[12px]"
              >
                <EyeOffIcon className="w-3.5 h-3.5" />
                Hide from Store
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-[12px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;

import { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteCoupon, updateCoupon } from "../../features/coupons/couponsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import { formatCurrency, formatDate } from "../../utils/format";
import {
  TagIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ClipboardIcon,
  CheckIcon,
} from "../common/Icon";
import { couponState, isExhausted, isExpired } from "../../utils/coupon";
import { notifySuccess, notifyError } from "../../lib/toast";

const STATE_BADGE = {
  active: { className: "badge-success", label: "Active" },
  paused: { className: "badge-neutral", label: "Paused" },
  expired: { className: "badge-danger", label: "Expired" },
  exhausted: { className: "badge-warning", label: "Exhausted" },
};

const ACCESSORS = {
  code: (c) => c.code,
  discount: (c) => Number(c.discountValue) || 0,
  minOrder: (c) => Number(c.minOrderValue) || 0,
  used: (c) => Number(c.usedCount) || 0,
  expiry: (c) => (c.expiryDate ? new Date(c.expiryDate).getTime() : null),
  status: (c) => couponState(c),
};

const CouponTable = ({ coupons, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const table = useTableControls(coupons, {
    accessors: ACCESSORS,
    initialSort: { key: "expiry", dir: "asc" },
    pageSize: 10,
  });

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    notifySuccess("Coupon code copied", code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (coupon) => {
    if (togglingId) return;
    const newActive = !coupon.isActive;
    setTogglingId(coupon._id);
    try {
      await dispatch(
        updateCoupon({ id: coupon._id, data: { isActive: newActive } }),
      ).unwrap();
    } catch {
      // toastMiddleware centrally handles failure toast
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteCoupon(deleteTarget._id)).unwrap();
    } catch {
      // toastMiddleware centrally handles failure toast
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-220">
            <thead>
              <tr>
                <SortableTh
                  label="Coupon Code"
                  sortKey="code"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Discount"
                  sortKey="discount"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Min Spend"
                  sortKey="minOrder"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Usage & Limit"
                  sortKey="used"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Valid Until"
                  sortKey="expiry"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.length > 0 ? (
                table.rows.map((coupon) => {
                  const state = couponState(coupon);
                  const badge = STATE_BADGE[state] || STATE_BADGE.active;
                  const expired = isExpired(coupon.expiryDate);
                  const exhausted = isExhausted(coupon);
                  const canToggle = !expired && !exhausted;

                  const usagePercent =
                    coupon.usageLimit != null && coupon.usageLimit > 0
                      ? Math.min(
                          100,
                          Math.round(
                            ((coupon.usedCount || 0) / coupon.usageLimit) * 100,
                          ),
                        )
                      : null;

                  return (
                    <tr
                      key={coupon._id}
                      className="hover:bg-(--surface-sunken)/70 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="code-chip font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 tracking-wider text-[12.5px]">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(e, coupon.code)}
                            className="p-1 rounded text-(--ink-faint) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
                            title={
                              copiedCode === coupon.code
                                ? "Copied!"
                                : "Copy coupon code"
                            }
                            aria-label={`Copy coupon code ${coupon.code}`}
                          >
                            {copiedCode === coupon.code ? (
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <ClipboardIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-baseline gap-1.5">
                          <p className="cell-strong text-(--ink) font-bold text-[13.5px]">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}% OFF`
                              : `${formatCurrency(coupon.discountValue)} OFF`}
                          </p>
                        </div>
                        <span className="cell-sub capitalize text-(--ink-muted) text-[11px] block mt-0.5">
                          {coupon.discountType === "percentage"
                            ? "Percentage discount"
                            : "Flat rupee deduction"}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <p className="font-semibold text-(--ink) text-[13px] tabular-nums">
                          {coupon.minOrderValue > 0
                            ? formatCurrency(coupon.minOrderValue)
                            : "₹0"}
                        </p>
                        <span className="cell-sub text-(--ink-muted) text-[11px] block">
                          {coupon.minOrderValue > 0
                            ? "Min cart value"
                            : "No minimum"}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <p className="cell-strong text-(--ink) text-[12.5px] tabular-nums font-semibold">
                          {coupon.usedCount || 0}
                          {coupon.usageLimit != null ? (
                            <span className="text-(--ink-muted) font-normal">
                              {" "}
                              / {coupon.usageLimit}
                            </span>
                          ) : (
                            <span className="text-(--ink-muted) text-[11px] font-normal">
                              {" "}
                              (unlimited)
                            </span>
                          )}
                        </p>
                        {usagePercent != null && (
                          <div className="w-20 ml-auto mt-1 h-1.5 rounded-full bg-(--surface-sunken) overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                exhausted ? "bg-amber-500" : "bg-(--brand)"
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        )}
                        {coupon.perUserLimit != null && (
                          <span className="cell-sub text-(--ink-faint) text-[10.5px] block mt-0.5">
                            Max {coupon.perUserLimit}/customer
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={`text-[12.5px] ${
                            expired
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-(--ink-soft)"
                          }`}
                        >
                          {coupon.expiryDate
                            ? formatDate(coupon.expiryDate)
                            : "No expiry"}
                        </span>
                        {expired && (
                          <span className="block text-[10.5px] text-rose-500 font-medium">
                            Offer ended
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${badge.className}`}>
                            <span className="badge-dot" />
                            {badge.label}
                          </span>
                          {canToggle && (
                            <button
                              type="button"
                              disabled={togglingId === coupon._id}
                              onClick={() => handleToggleActive(coupon)}
                              className={`text-[10.5px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                coupon.isActive
                                  ? "text-(--ink-muted) hover:text-(--ink) border-(--border) hover:bg-(--surface-sunken)"
                                  : "text-(--brand) border-(--brand)/40 bg-(--brand-soft) hover:opacity-85"
                              }`}
                              title={
                                coupon.isActive
                                  ? "Click to pause this coupon"
                                  : "Click to activate this coupon"
                              }
                            >
                              {coupon.isActive ? "Pause" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onEdit(coupon)}
                            className="icon-btn icon-btn-edit"
                            title="Edit coupon rules & limits"
                            aria-label={`Edit ${coupon.code}`}
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(coupon)}
                            className="icon-btn icon-btn-delete"
                            title="Delete coupon"
                            aria-label={`Delete ${coupon.code}`}
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    <EmptyState
                      icon={<TagIcon className="w-5 h-5" />}
                      title="No coupons found"
                      message="Discount codes created for customer checkout will show up here."
                      action={
                        onCreate && (
                          <button
                            onClick={onCreate}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add coupon
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={table.page}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          total={table.total}
          rangeStart={table.rangeStart}
          rangeEnd={table.rangeEnd}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
          noun="coupons"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete coupon code?"
        message={
          deleteTarget
            ? `Customers will no longer be able to apply code “${deleteTarget.code}” at checkout. This action cannot be undone.`
            : ""
        }
        confirmLabel="Yes, Delete Coupon"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default CouponTable;

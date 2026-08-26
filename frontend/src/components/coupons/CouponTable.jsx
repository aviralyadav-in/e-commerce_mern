import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteCoupon } from "../../features/coupons/couponsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import { formatCurrency, formatDate } from "../../utils/format";
import { TagIcon, PencilIcon, TrashIcon, PlusIcon } from "../common/Icon";

export const isExpired = (date) => !!date && new Date(date) < new Date();

/** A coupon is only usable when it is switched on AND still in date. */
export const couponState = (coupon) => {
  if (isExpired(coupon.expiryDate)) return "expired";
  return coupon.isActive ? "active" : "paused";
};

const STATE_BADGE = {
  active: { className: "badge-success", label: "Active" },
  paused: { className: "badge-neutral", label: "Paused" },
  expired: { className: "badge-danger", label: "Expired" },
};

const ACCESSORS = {
  code: (c) => c.code,
  discount: (c) => Number(c.discountValue) || 0,
  minOrder: (c) => Number(c.minOrderValue) || 0,
  expiry: (c) => (c.expiryDate ? new Date(c.expiryDate).getTime() : null),
  status: (c) => couponState(c),
};

const CouponTable = ({ coupons, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const table = useTableControls(coupons, {
    accessors: ACCESSORS,
    initialSort: { key: "expiry", dir: "asc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteCoupon(deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-205">
            <thead>
              <tr>
                <SortableTh
                  label="Code"
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
                  label="Min order"
                  sortKey="minOrder"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Expires"
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
                  const badge = STATE_BADGE[state];
                  const expired = state === "expired";

                  return (
                    <tr key={coupon._id}>
                      <td>
                        <span className="code-chip">{coupon.code}</span>
                      </td>
                      <td>
                        <p className="cell-strong">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}% off`
                            : `${formatCurrency(coupon.discountValue)} off`}
                        </p>
                        <span className="cell-sub capitalize">
                          {coupon.discountType === "percentage"
                            ? "Percentage"
                            : "Flat amount"}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {coupon.minOrderValue
                          ? formatCurrency(coupon.minOrderValue)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={expired ? "text-red-600 font-medium" : ""}
                        >
                          {formatDate(coupon.expiryDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-dot ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onEdit(coupon)}
                            title="Edit coupon"
                            aria-label={`Edit ${coupon.code}`}
                            className="icon-btn icon-btn-edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(coupon)}
                            title="Delete coupon"
                            aria-label={`Delete ${coupon.code}`}
                            className="icon-btn icon-btn-delete"
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
                  <td colSpan="6" className="empty-cell">
                    <EmptyState
                      icon={<TagIcon className="w-5 h-5" />}
                      title="No coupons yet"
                      message="Create a discount code that customers can apply at checkout."
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
        title="Delete coupon?"
        message={
          deleteTarget
            ? `Customers will no longer be able to apply “${deleteTarget.code}”. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete coupon"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default CouponTable;

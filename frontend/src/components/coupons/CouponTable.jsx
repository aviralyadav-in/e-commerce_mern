import { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteCoupon } from "../../features/coupons/couponsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import { formatCurrency, formatDate } from "../../utils/format";
import { TagIcon, PencilIcon, TrashIcon, PlusIcon } from "../common/Icon";
import { couponState } from "../../utils/coupon";

const STATE_BADGE = {
  active: { className: "badge-success", label: "Active" },
  paused: { className: "badge-neutral", label: "Paused" },
  expired: { className: "badge-danger", label: "Expired" },
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
                  label="Used"
                  sortKey="used"
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
                    <tr key={coupon._id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <span className="code-chip font-bold text-indigo-700 bg-indigo-50/80 border-indigo-200">
                          {coupon.code}
                        </span>
                      </td>
                      <td>
                        <p className="cell-strong text-slate-900 font-bold">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}% OFF`
                            : `${formatCurrency(coupon.discountValue)} OFF`}
                        </p>
                        <span className="cell-sub capitalize text-slate-400 text-[11px]">
                          {coupon.discountType || "percentage"} discount
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap font-medium text-slate-700">
                        {coupon.minOrderValue > 0
                          ? formatCurrency(coupon.minOrderValue)
                          : "No minimum"}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={`text-[12.5px] ${
                            expired
                              ? "text-rose-600 font-semibold"
                              : "text-slate-600"
                          }`}
                        >
                          {coupon.expiryDate ? formatDate(coupon.expiryDate) : "Never"}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <p className="cell-strong text-slate-800 text-[12.5px] tabular-nums">
                          {coupon.usedCount || 0}
                          {coupon.usageLimit != null
                            ? ` / ${coupon.usageLimit}`
                            : ""}
                        </p>
                        {coupon.perUserLimit != null && (
                          <span className="cell-sub text-slate-400 text-[10.5px]">
                            max {coupon.perUserLimit}/user
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${badge.className}`}>
                          <span className="badge-dot" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onEdit(coupon)}
                            className="icon-btn icon-btn-edit"
                            title="Edit coupon"
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

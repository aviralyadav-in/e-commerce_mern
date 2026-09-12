import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  deleteReview,
  updateReviewStatus,
} from "../../features/reviews/reviewsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { formatDate, initials } from "../../utils/format";
import {
  CheckIcon,
  EyeOffIcon,
  EyeIcon,
  StarIcon,
  StarFilledIcon,
  TrashIcon,
} from "../common/Icon";
import { notifySuccess, notifyError } from "../../lib/toast";

export const StarRow = ({ rating = 0, size = "w-3.5 h-3.5" }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) =>
      n <= rating ? (
        <StarFilledIcon key={n} className={`${size} text-amber-400`} />
      ) : (
        <StarIcon key={n} className={`${size} text-(--border-strong)`} />
      ),
    )}
  </div>
);

const ACCESSORS = {
  customer: (r) => r.user?.name || "",
  product: (r) => r.product?.name || "",
  rating: (r) => Number(r.rating) || 0,
  date: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : null),
};

const ReviewTable = ({ reviews, onView }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const table = useTableControls(reviews, {
    accessors: ACCESSORS,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 10,
  });

  const handleStatusChange = async (review, newStatus) => {
    setUpdatingId(review._id);
    try {
      await dispatch(
        updateReviewStatus({ id: review._id, status: newStatus }),
      ).unwrap();
    } catch {
      // toastMiddleware handles user notification
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteReview(deleteTarget._id)).unwrap();
    } catch {
      // toastMiddleware handles user notification
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-225">
            <thead>
              <tr>
                <SortableTh
                  label="Customer"
                  sortKey="customer"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Product"
                  sortKey="product"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Rating"
                  sortKey="rating"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col">Review Feedback</th>
                <th scope="col">Status</th>
                <SortableTh
                  label="Date"
                  sortKey="date"
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
                table.rows.map((review) => {
                  const productImg =
                    review.product?.images?.desktop?.[0] ||
                    review.product?.images?.mobile?.[0];
                  const status = review.status || "Pending";
                  const isPending = status === "Pending";

                  return (
                    <tr
                      key={review._id}
                      className="hover:bg-(--surface-sunken)/70 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-50 to-slate-100 dark:from-indigo-950 dark:to-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-xs">
                            {initials(review.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="cell-strong truncate max-w-36 text-[13px] text-(--ink)">
                                {review.user?.name || "Customer"}
                              </p>
                              {review.verifiedPurchase && (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0"
                                  title="Verified Purchase — Customer ordered this product"
                                >
                                  Verified
                                </span>
                              )}
                            </div>
                            <span className="cell-sub truncate max-w-40 text-(--ink-muted) text-[11px] block">
                              {review.user?.email || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Thumb
                            src={productImg}
                            alt={review.product?.name}
                            className="w-9 h-9 shrink-0"
                            rounded="rounded-(--radius-sm)"
                          />
                          <p className="cell-strong truncate max-w-45 text-[12.5px] text-(--ink)">
                            {review.product?.name || "Product item"}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="space-y-0.5">
                          <StarRow rating={review.rating} />
                          <span className="cell-sub font-bold text-(--ink) text-[11.5px]">
                            {review.rating} of 5 stars
                          </span>
                        </div>
                      </td>
                      <td className="max-w-65">
                        <p
                          onClick={() => onView?.(review)}
                          className="line-clamp-2 text-(--ink-soft) text-[12.5px] cursor-pointer hover:text-(--brand) transition-colors"
                          title="Click to view full review feedback"
                        >
                          &ldquo;{review.comment || review.review || "No written review"}&rdquo;
                        </p>
                      </td>
                      <td>
                        <span
                          className={`badge ${
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
                      </td>
                      <td className="whitespace-nowrap text-(--ink-muted) text-[12px]">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              disabled={updatingId === review._id}
                              onClick={() => handleStatusChange(review, "Approved")}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                              title="Approve review (publish to product page)"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}
                          {!isPending && status !== "Approved" && (
                            <button
                              disabled={updatingId === review._id}
                              onClick={() => handleStatusChange(review, "Approved")}
                              className="icon-btn icon-btn-view"
                              title="Re-Approve review"
                              aria-label="Re-Approve review"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {status !== "Hidden" && (
                            <button
                              disabled={updatingId === review._id}
                              onClick={() => handleStatusChange(review, "Hidden")}
                              className="icon-btn icon-btn-ghost"
                              title="Hide from store"
                              aria-label="Hide from store"
                            >
                              <EyeOffIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onView?.(review)}
                            className="icon-btn icon-btn-view"
                            title="View full review details"
                            aria-label="View review"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(review)}
                            className="icon-btn icon-btn-delete"
                            title="Delete review"
                            aria-label="Delete review"
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
                      icon={<StarIcon className="w-5 h-5" />}
                      title="No reviews found"
                      message="Customer product reviews will show up here as shoppers leave ratings."
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
          noun="reviews"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete customer review?"
        message={
          deleteTarget
            ? `This will permanently delete ${
                deleteTarget.user?.name || "the customer"
              }'s review for “${deleteTarget.product?.name || "this product"}” and recalculate the product's average rating.`
            : ""
        }
        confirmLabel="Yes, Delete Review"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ReviewTable;

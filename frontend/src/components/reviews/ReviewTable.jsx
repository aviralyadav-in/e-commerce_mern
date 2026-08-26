import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteReview } from "../../features/reviews/reviewsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { formatDate, initials } from "../../utils/format";
import { StarIcon, StarFilledIcon, TrashIcon } from "../common/Icon";

export const StarRow = ({ rating = 0, size = "w-3.5 h-3.5" }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) =>
      n <= rating ? (
        <StarFilledIcon key={n} className={`${size} text-amber-400`} />
      ) : (
        <StarIcon key={n} className={`${size} text-gray-300`} />
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

const ReviewTable = ({ reviews }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const table = useTableControls(reviews, {
    accessors: ACCESSORS,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteReview(deleteTarget._id));
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
                <th scope="col">Comment</th>
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
                  return (
                    <tr key={review._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="avatar w-7 h-7 text-[10.5px] bg-orange-50! text-(--brand)!">
                            {initials(review.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-37.5">
                              {review.user?.name || "Unknown"}
                            </p>
                            <span className="cell-sub truncate max-w-37.5">
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
                            className="w-8 h-8"
                          />
                          <span className="cell-strong truncate max-w-40">
                            {review.product?.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <StarRow rating={review.rating || 0} />
                          <span className="text-[11.5px] font-semibold text-(--ink-muted)">
                            {review.rating || 0}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-65">
                        <p className="line-clamp-2 text-(--ink-muted)">
                          {review.comment || "—"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setDeleteTarget(review)}
                          className="icon-btn icon-btn-delete"
                          title="Delete review"
                          aria-label="Delete review"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    <EmptyState
                      icon={<StarIcon className="w-5 h-5" />}
                      title="No reviews yet"
                      message="Customer reviews of your products will show up here once they start rating."
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
        title="Delete review?"
        message={
          deleteTarget
            ? `This permanently removes ${
                deleteTarget.user?.name || "the customer"
              }'s review and recalculates the product's rating.`
            : ""
        }
        confirmLabel="Delete review"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ReviewTable;

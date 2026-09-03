import { useState } from "react";
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
                    <tr key={review._id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-indigo-100">
                            {initials(review.user?.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-40 text-[13px]">
                              {review.user?.name || "Customer"}
                            </p>
                            <span className="cell-sub truncate max-w-40 text-slate-400 text-[11px]">
                              {review.user?.email || "Verified Buyer"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Thumb
                            src={productImg}
                            alt={review.product?.name}
                            className="w-9 h-9"
                            rounded="rounded-lg"
                          />
                          <p className="cell-strong truncate max-w-45 text-[12.5px]">
                            {review.product?.name || "Product item"}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="space-y-0.5">
                          <StarRow rating={review.rating} />
                          <span className="cell-sub font-bold text-slate-800 text-[11.5px]">
                            {review.rating} of 5 stars
                          </span>
                        </div>
                      </td>
                      <td className="max-w-65">
                        <p className="line-clamp-2 text-slate-600 text-[12.5px] italic">
                          "{review.comment || review.review || "No written review"}"
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-slate-500 text-[12px]">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end">
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

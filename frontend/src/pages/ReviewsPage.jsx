import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllReviews } from "../features/reviews/reviewsSlice";
import { exportAllReviewsToExcel } from "../utils/exportProductToExcel";
import { notifyInfo } from "../lib/toast";

import ReviewTable from "../components/reviews/ReviewTable";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, StarFilledIcon } from "../components/common/Icon";

const ReviewsPage = () => {
  const dispatch = useDispatch();
  const { reviews, loading, error } = useSelector((state) => state.reviews);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState(null);

  useEffect(() => {
    dispatch(fetchAllReviews());
  }, [dispatch]);

  /** How many reviews sit at each star value — drives the filter counts. */
  const byRating = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const n = Number(r.rating);
      if (buckets[n] != null) buckets[n] += 1;
    });
    return buckets;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (rating && Number(r.rating) !== rating) return false;
      if (!q) return true;
      return (
        String(r.user?.name || "")
          .toLowerCase()
          .includes(q) ||
        String(r.user?.email || "")
          .toLowerCase()
          .includes(q) ||
        String(r.product?.name || "")
          .toLowerCase()
          .includes(q) ||
        String(r.comment || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [reviews, search, rating]);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const negative = byRating[1] + byRating[2];

  const handleExportAll = () => {
    if (!reviews.length) {
      notifyInfo("Nothing to export", "No reviews have been left yet.");
      return;
    }
    exportAllReviewsToExcel(reviews);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Reviews"
        subtitle="Moderate what customers are saying about your products."
        meta={
          <>
            <span className="meta-chip meta-chip-warning">
              <b>{avgRating}</b> avg rating
            </span>
            <span className="meta-chip">
              <b>{reviews.length}</b> total
            </span>
            {negative > 0 && (
              <span className="meta-chip meta-chip-danger">
                <b>{negative}</b> at 1–2 ★
              </span>
            )}
          </>
        }
        actions={
          <button
            onClick={handleExportAll}
            title="Download all reviews as Excel"
            className="btn btn-export"
          >
            <DownloadIcon className="w-4 h-4" />
            Export
          </button>
        }
      />

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customer, product or comment…"
        />
        <SegmentedFilter
          value={rating}
          onChange={setRating}
          options={[
            { value: null, label: "All", count: reviews.length },
            { value: 5, label: "5 ★", count: byRating[5] },
            { value: 4, label: "4 ★", count: byRating[4] },
            { value: 3, label: "3 ★", count: byRating[3] },
            { value: 2, label: "2 ★", count: byRating[2] },
            { value: 1, label: "1 ★", count: byRating[1] },
          ]}
        />
      </div>

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchAllReviews())}
      />

      {loading && reviews.length === 0 ? (
        <TableSkeleton rows={6} columns={6} hasThumb />
      ) : (
        <ReviewTable reviews={filtered} />
      )}

      {reviews.length > 0 && (
        <p className="flex items-center gap-1.5 mt-3 text-[11.5px] text-(--ink-faint)">
          <StarFilledIcon className="w-3.5 h-3.5 text-amber-400" />
          Deleting a review recalculates that product&apos;s average rating.
        </p>
      )}
    </div>
  );
};

export default ReviewsPage;

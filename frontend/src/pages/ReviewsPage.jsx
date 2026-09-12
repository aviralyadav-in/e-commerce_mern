import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllReviews,
  updateReviewStatus,
  deleteReview,
} from "../features/reviews/reviewsSlice";
import { exportAllReviewsToExcel } from "../utils/exportProductToExcel";
import { notifyInfo, notifySuccess, notifyError } from "../lib/toast";

import ReviewTable from "../components/reviews/ReviewTable";
import ReviewDetailModal from "../components/reviews/ReviewDetailModal";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import {
  CheckIcon,
  DownloadIcon,
  StarFilledIcon,
  MessageSquareIcon,
} from "../components/common/Icon";

const ReviewsPage = () => {
  const dispatch = useDispatch();
  const { reviews, loading, error } = useSelector((state) => state.reviews);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showGuide, setShowGuide] = useState(true);
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    dispatch(fetchAllReviews());
  }, [dispatch]);

  const byRating = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const n = Number(r.rating);
      if (buckets[n] != null) buckets[n] += 1;
    });
    return buckets;
  }, [reviews]);

  const statusCounts = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Hidden: 0 };
    reviews.forEach((r) => {
      const s = r.status || "Pending";
      if (counts[s] != null) counts[s] += 1;
    });
    return counts;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (status && (r.status || "Pending") !== status) return false;
      if (rating && Number(r.rating) !== rating) return false;
      if (!q) return true;
      const reviewStatus = (r.status || "Pending").toLowerCase();
      const ratingStr = `${r.rating} star`;
      const isVerified = r.verifiedPurchase ? "verified buyer" : "";
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
          .includes(q) ||
        reviewStatus.includes(q) ||
        ratingStr.includes(q) ||
        isVerified.includes(q)
      );
    });
  }, [reviews, search, rating, status]);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const negative = (byRating[1] || 0) + (byRating[2] || 0);

  const handleExportAll = () => {
    if (!reviews.length) {
      notifyInfo("Nothing to export", "No reviews have been left yet.");
      return;
    }
    exportAllReviewsToExcel(reviews);
  };

  const handleApproveAllPending = async () => {
    const pending = reviews.filter((r) => (r.status || "Pending") === "Pending");
    if (!pending.length) return;
    setBulkApproving(true);
    try {
      await Promise.all(
        pending.map((r) =>
          dispatch(
            updateReviewStatus({ id: r._id, status: "Approved" }),
          ).unwrap(),
        ),
      );
      notifySuccess(
        "All pending reviews approved",
        `${pending.length} reviews are now visible on the storefront.`,
      );
    } catch (err) {
      notifyError("Failed to approve some reviews", err || "Something went wrong");
    } finally {
      setBulkApproving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRating(null);
    setStatus(null);
  };

  // Modal actions
  const handleModalApprove = async (review) => {
    try {
      await dispatch(
        updateReviewStatus({ id: review._id, status: "Approved" }),
      ).unwrap();
      setSelectedReview(null);
    } catch {
      // toastMiddleware handles user notification
    }
  };

  const handleModalHide = async (review) => {
    try {
      await dispatch(
        updateReviewStatus({ id: review._id, status: "Hidden" }),
      ).unwrap();
      setSelectedReview(null);
    } catch {
      // toastMiddleware handles user notification
    }
  };

  const handleModalDelete = async (review) => {
    try {
      await dispatch(deleteReview(review._id)).unwrap();
      setSelectedReview(null);
    } catch {
      // toastMiddleware handles user notification
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Reviews"
        subtitle="Moderate customer product ratings and reviews before they appear live on your storefront."
        meta={
          <>
            <span className="meta-chip meta-chip-warning">
              <b>{avgRating}</b> avg star rating
            </span>
            <span className="meta-chip">
              <b>{reviews.length}</b> total reviews
            </span>
            {statusCounts.Pending > 0 && (
              <span className="meta-chip meta-chip-warning animate-pulse">
                <b>{statusCounts.Pending}</b> awaiting approval
              </span>
            )}
            <span className="meta-chip meta-chip-success">
              <b>{statusCounts.Approved || 0}</b> live on store
            </span>
            {negative > 0 && (
              <span className="meta-chip meta-chip-danger">
                <b>{negative}</b> critical (1–2 ★)
              </span>
            )}
          </>
        }
        actions={
          <>
            {statusCounts.Pending > 0 && (
              <button
                disabled={bulkApproving}
                onClick={handleApproveAllPending}
                className="btn btn-primary"
                title="Approve all pending customer reviews at once"
              >
                <CheckIcon className="w-4 h-4" />
                {bulkApproving
                  ? "Approving…"
                  : `Approve All Pending (${statusCounts.Pending})`}
              </button>
            )}
            <button
              onClick={handleExportAll}
              title="Download all reviews as Excel"
              className="btn btn-export"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Excel
            </button>
          </>
        }
      />

      {/* 5-10 Second Non-Technical Admin Moderation Guide Ribbon */}
      {showGuide && (
        <div className="mb-4 p-3.5 rounded-(--radius) border border-(--border) bg-(--surface-card) shadow-2xs flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-(--brand-soft) text-(--brand) flex items-center justify-center font-bold text-[11px] shrink-0">
              <MessageSquareIcon className="w-3 h-3" />
            </span>
            <div>
              <span className="font-bold text-(--ink)">
                Review Moderation Rules:
              </span>{" "}
              <span className="text-(--ink-muted) hidden md:inline">
                Customer reviews require your approval before appearing on product pages.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/20">
              Pending = Needs your approval
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
              Approved = Live on store (⭐ counted)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-500/10 text-(--ink-soft) font-semibold border border-(--border)">
              Hidden = Private from shoppers
            </span>
            <button
              onClick={() => setShowGuide(false)}
              className="ml-2 text-(--ink-faint) hover:text-(--ink) text-[11px] underline cursor-pointer"
              title="Dismiss guide"
            >
              Hide
            </button>
          </div>
        </div>
      )}

      {/* Moderation Status Filter Tabs */}
      <div className="admin-toolbar mb-2.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer, product, or review text…"
        />
        <SegmentedFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All Statuses", count: reviews.length },
            {
              value: "Pending",
              label: "Pending",
              count: statusCounts.Pending,
            },
            {
              value: "Approved",
              label: "Approved",
              count: statusCounts.Approved,
            },
            { value: "Hidden", label: "Hidden", count: statusCounts.Hidden },
          ]}
        />
      </div>

      {/* Star Rating Filter Chips Bar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="text-(--ink-muted) font-medium mr-1">
          Filter by rating:
        </span>
        {[
          { label: "All Stars", val: null, count: reviews.length },
          { label: "5 ★", val: 5, count: byRating[5] || 0 },
          { label: "4 ★", val: 4, count: byRating[4] || 0 },
          { label: "3 ★", val: 3, count: byRating[3] || 0 },
          { label: "2 ★", val: 2, count: byRating[2] || 0 },
          { label: "1 ★", val: 1, count: byRating[1] || 0 },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setRating(item.val)}
            className={`px-2.5 py-1 rounded-(--radius) text-[11.5px] font-semibold border transition-all cursor-pointer ${
              rating === item.val
                ? "bg-(--brand) text-white border-(--brand) shadow-2xs"
                : "bg-(--surface-card) border-(--border) text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {(search || status || rating) && filtered.length === 0 && (
        <div className="mb-3 flex items-center justify-between p-2.5 rounded-(--radius) bg-(--surface-sunken) text-[12px] text-(--ink-muted)">
          <span>
            No reviews match current filters:{" "}
            <b>{status ? `Status: ${status}` : ""}</b>{" "}
            {rating ? `Rating: ${rating} ★` : ""}{" "}
            {search ? `"${search}"` : ""}
          </span>
          <button
            onClick={clearFilters}
            className="text-(--brand) font-semibold hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchAllReviews())}
      />

      {loading && reviews.length === 0 ? (
        <TableSkeleton rows={6} columns={6} hasThumb />
      ) : (
        <ReviewTable
          reviews={filtered}
          onView={(review) => setSelectedReview(review)}
        />
      )}

      <ReviewDetailModal
        isOpen={!!selectedReview}
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onApprove={handleModalApprove}
        onHide={handleModalHide}
        onDelete={handleModalDelete}
      />
    </div>
  );
};

export default ReviewsPage;

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCoupons,
  bulkCreateCoupons,
} from "../features/coupons/couponsSlice";
import { exportAllCouponsToExcel } from "../utils/exportProductToExcel";
import { notifyInfo } from "../lib/toast";

import CouponTable from "../components/coupons/CouponTable";
import { couponState } from "../utils/coupon";
import CouponModal from "../components/coupons/CouponModal";
import BulkUploadModal from "../components/common/BulkUploadModal";
import { downloadCouponsSampleCsv } from "../utils/csvTemplates";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import {
  DownloadIcon,
  PlusIcon,
  UploadIcon,
  TagIcon,
} from "../components/common/Icon";

const CouponsPage = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error } = useSelector((state) => state.coupons);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [showHelperRibbon, setShowHelperRibbon] = useState(true);

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const counts = useMemo(
    () =>
      coupons.reduce(
        (acc, c) => {
          const s = couponState(c);
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        { active: 0, paused: 0, expired: 0, exhausted: 0 },
      ),
    [coupons],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((c) => {
      if (status && couponState(c) !== status) return false;
      if (!q) return true;
      const discountFormatted =
        c.discountType === "percentage"
          ? `${c.discountValue}%`
          : `₹${c.discountValue}`;
      return (
        String(c.code || "").toLowerCase().includes(q) ||
        String(c.discountType || "").toLowerCase().includes(q) ||
        String(c.discountValue || "").toLowerCase().includes(q) ||
        discountFormatted.toLowerCase().includes(q) ||
        String(c.minOrderValue || "").toLowerCase().includes(q) ||
        couponState(c).toLowerCase().includes(q)
      );
    });
  }, [coupons, search, status]);

  const handleOpenAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditData(coupon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleExportAll = () => {
    if (!coupons.length) {
      notifyInfo("Nothing to export", "Create a coupon first.");
      return;
    }
    exportAllCouponsToExcel(coupons);
  };

  const handleBulkUpload = async (formData) => {
    const result = await dispatch(bulkCreateCoupons(formData));
    if (bulkCreateCoupons.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload || "Bulk import failed");
  };

  const clearFilters = () => {
    setSearch("");
    setStatus(null);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Coupons"
        subtitle="Create and manage promotional discount codes that customers apply at checkout."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>{counts.active || 0}</b> active
            </span>
            <span className="meta-chip">
              <b>{counts.paused || 0}</b> paused
            </span>
            {counts.exhausted > 0 && (
              <span className="meta-chip meta-chip-warning">
                <b>{counts.exhausted}</b> limit reached
              </span>
            )}
            <span className="meta-chip meta-chip-danger">
              <b>{counts.expired || 0}</b> expired
            </span>
          </>
        }
        actions={
          <>
            <button
              onClick={handleExportAll}
              title="Download all coupons as Excel"
              className="btn btn-export"
            >
              <DownloadIcon className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="btn btn-secondary"
              title="Bulk import coupons from CSV"
            >
              <UploadIcon className="w-4 h-4" />
              Import CSV
            </button>
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add coupon
            </button>
          </>
        }
      />

      {/* 5-10 Second Non-Technical Admin Coupon Guide */}
      {showHelperRibbon && (
        <div className="mb-4 p-3.5 rounded-(--radius) border border-(--border) bg-(--surface-card) shadow-2xs flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-(--brand-soft) text-(--brand) flex items-center justify-center font-bold text-[11px] shrink-0">
              <TagIcon className="w-3 h-3" />
            </span>
            <div>
              <span className="font-bold text-(--ink)">
                Quick Coupon Guide:
              </span>{" "}
              <span className="text-(--ink-muted) hidden md:inline">
                Share codes with customers to offer discounts. You can set minimum cart spend, per-user limits, and total usage caps.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
              Active = Usable now
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-500/10 text-(--ink-soft) font-semibold border border-(--border)">
              Paused = Temporarily stopped
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-800 dark:text-rose-300 font-semibold border border-rose-500/20">
              Expired = Past end date
            </span>
            <button
              onClick={() => setShowHelperRibbon(false)}
              className="ml-2 text-(--ink-faint) hover:text-(--ink) text-[11px] underline cursor-pointer"
              title="Dismiss guide"
            >
              Hide
            </button>
          </div>
        </div>
      )}

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by coupon code…"
        />
        <SegmentedFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: coupons.length },
            { value: "active", label: "Active", count: counts.active || 0 },
            { value: "paused", label: "Paused", count: counts.paused || 0 },
            ...(counts.exhausted > 0
              ? [
                  {
                    value: "exhausted",
                    label: "Exhausted",
                    count: counts.exhausted,
                  },
                ]
              : []),
            { value: "expired", label: "Expired", count: counts.expired || 0 },
          ]}
        />
      </div>

      {(search || status) && filtered.length === 0 && (
        <div className="mb-3 flex items-center justify-between p-2.5 rounded-(--radius) bg-(--surface-sunken) text-[12px] text-(--ink-muted)">
          <span>
            No coupons match current filter:{" "}
            <b>{status ? `Status: ${status}` : ""}</b>{" "}
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

      <ErrorBanner message={error} onRetry={() => dispatch(fetchCoupons())} />

      {loading && coupons.length === 0 ? (
        <TableSkeleton rows={6} columns={6} />
      ) : (
        <CouponTable
          coupons={filtered}
          onEdit={handleOpenEdit}
          onCreate={handleOpenAdd}
        />
      )}

      <CouponModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />

      {/* CSV bulk import */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Import coupons via CSV"
        subtitle="Bulk create multiple coupon codes at once using a CSV spreadsheet."
        uploadHint={
          <>
            Required columns: <b>code</b>, <b>discountType</b> (percentage/flat),{" "}
            <b>discountValue</b>, <b>expiryDate</b> (YYYY-MM-DD). Optional:{" "}
            minOrderValue, usageLimit, perUserLimit, isActive (true/false).
            Duplicate coupon codes will be safely skipped.
          </>
        }
        onDownloadSample={downloadCouponsSampleCsv}
        onSubmit={handleBulkUpload}
      />
    </div>
  );
};

export default CouponsPage;

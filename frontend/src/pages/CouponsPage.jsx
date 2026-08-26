import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCoupons } from "../features/coupons/couponsSlice";
import { exportAllCouponsToExcel } from "../utils/exportProductToExcel";
import { toastInfo } from "../features/ui/uiSlice";

import CouponTable, { couponState } from "../components/coupons/CouponTable";
import CouponModal from "../components/coupons/CouponModal";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, PlusIcon } from "../components/common/Icon";

const CouponsPage = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error } = useSelector((state) => state.coupons);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    dispatch(fetchCoupons());
  }, [dispatch]);

  const counts = useMemo(
    () =>
      coupons.reduce(
        (acc, c) => {
          acc[couponState(c)] += 1;
          return acc;
        },
        { active: 0, paused: 0, expired: 0 },
      ),
    [coupons],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((c) => {
      if (status && couponState(c) !== status) return false;
      if (!q) return true;
      return String(c.code || "").toLowerCase().includes(q);
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
      dispatch(toastInfo("Nothing to export", "Create a coupon first."));
      return;
    }
    exportAllCouponsToExcel(coupons);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Coupons"
        subtitle="Discount codes customers can apply at checkout."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>{counts.active}</b> active
            </span>
            <span className="meta-chip">
              <b>{counts.paused}</b> paused
            </span>
            <span className="meta-chip meta-chip-danger">
              <b>{counts.expired}</b> expired
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
              Export
            </button>
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add coupon
            </button>
          </>
        }
      />

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
            { value: "active", label: "Active", count: counts.active },
            { value: "paused", label: "Paused", count: counts.paused },
            { value: "expired", label: "Expired", count: counts.expired },
          ]}
        />
      </div>

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
    </div>
  );
};

export default CouponsPage;

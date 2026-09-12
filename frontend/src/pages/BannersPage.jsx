import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBanners,
  toggleBannerStatus,
} from "../features/banners/bannersSlice";
import { exportAllBannersToExcel } from "../utils/exportProductToExcel";
import { notifyInfo } from "../lib/toast";

import BannerTable from "../components/banners/BannerTable";
import BannerModal from "../components/banners/BannerModal";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, PlusIcon } from "../components/common/Icon";

const BannersPage = () => {
  const dispatch = useDispatch();
  const { banners, loading, error } = useSelector((state) => state.banners);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [pageFilter, setPageFilter] = useState(null);

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  const activeCount = banners.filter((b) => b.isActive).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return banners.filter((b) => {
      if (pageFilter && b.page !== pageFilter) return false;
      if (status === "active" && !b.isActive) return false;
      if (status === "inactive" && b.isActive) return false;
      if (!q) return true;
      return (
        String(b.title || "").toLowerCase().includes(q) ||
        String(b.subtitle || "").toLowerCase().includes(q) ||
        String(b.linkUrl || "").toLowerCase().includes(q)
      );
    });
  }, [banners, search, status, pageFilter]);

  const handleOpenAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditData(banner);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleExportAll = () => {
    if (!banners.length) {
      notifyInfo("Nothing to export", "Add a banner first.");
      return;
    }
    exportAllBannersToExcel(banners);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Banners"
        subtitle="Hero promotional banners and campaign slots displayed across storefront pages."
        meta={
          <>
            <span className="meta-chip">
              <b>{banners.length}</b> total
            </span>
            <span className="meta-chip meta-chip-success">
              <b>{activeCount}</b> live
            </span>
          </>
        }
        actions={
          <>
            <button
              onClick={handleExportAll}
              title="Download all banners as Excel"
              className="btn btn-export"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add banner
            </button>
          </>
        }
      />

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title, subtitle or link…"
        />
        <select
          value={pageFilter || ""}
          onChange={(e) => setPageFilter(e.target.value || null)}
          className="admin-select"
          aria-label="Filter by page"
        >
          <option value="">All pages</option>
          <option value="home">Home</option>
          <option value="shop">Shop</option>
          <option value="wishlist">Wishlist</option>
        </select>
        <SegmentedFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: banners.length },
            { value: "active", label: "Active", count: activeCount },
            {
              value: "inactive",
              label: "Inactive",
              count: banners.length - activeCount,
            },
          ]}
        />
      </div>

      <ErrorBanner message={error} onRetry={() => dispatch(fetchBanners())} />

      {loading && banners.length === 0 ? (
        <TableSkeleton rows={5} columns={5} hasThumb />
      ) : (
        <BannerTable
          banners={filtered}
          onEdit={handleOpenEdit}
          onCreate={handleOpenAdd}
          onToggleStatus={(id) => dispatch(toggleBannerStatus(id))}
        />
      )}

      <BannerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />
    </div>
  );
};

export default BannersPage;

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  bulkCreateCollections,
  fetchCollections,
} from "../features/collections/collectionsSlice";
import { exportAllCollectionsToExcel } from "../utils/exportProductToExcel";
import { downloadCollectionsSampleCsv } from "../utils/csvTemplates";
import { notifyInfo } from "../lib/toast";

import CollectionTable from "../components/collections/CollectionTable";
import CollectionModal from "../components/collections/CollectionModal";
import CollectionProductsModal from "../components/collections/CollectionProductsModal";
import PageHeader from "../components/common/PageHeader";
import BulkUploadModal from "../components/common/BulkUploadModal";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, PlusIcon, UploadIcon } from "../components/common/Icon";

const CollectionsPage = () => {
  const dispatch = useDispatch();
  const { collections, loading, error, deleteLoading } = useSelector(
    (state) => state.collections,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewingCollection, setViewingCollection] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  const activeCount = collections.filter((c) => c.isActive !== false).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections.filter((c) => {
      if (status === "active" && c.isActive === false) return false;
      if (status === "inactive" && c.isActive !== false) return false;
      if (!q) return true;
      return (
        String(c.name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.slug || "")
          .toLowerCase()
          .includes(q) ||
        String(c.description || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [collections, search, status]);

  const handleOpenAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (collection) => {
    setEditData(collection);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleExportAll = () => {
    if (!collections.length) {
      notifyInfo("Nothing to export", "Add a collection first.");
      return;
    }
    exportAllCollectionsToExcel(collections);
  };

  const handleBulkUpload = async (formData) => {
    const result = await dispatch(bulkCreateCollections(formData));
    if (bulkCreateCollections.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload || "Bulk import failed");
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Collections"
        subtitle="Curate products for marketing campaigns, homepage showcases, and promotional badges."
        meta={
          <>
            <span className="meta-chip">
              <b>{collections.length}</b> total
            </span>
            <span className="meta-chip meta-chip-success">
              <b>{activeCount}</b> active
            </span>
          </>
        }
        actions={
          <>
            <button
              onClick={handleExportAll}
              title="Download all collections as Excel"
              className="btn btn-export"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="btn btn-secondary"
            >
              <UploadIcon className="w-4 h-4" />
              Import CSV
            </button>
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add collection
            </button>
          </>
        }
      />

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, slug or description…"
        />
        <SegmentedFilter
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: collections.length },
            { value: "active", label: "Active", count: activeCount },
            {
              value: "inactive",
              label: "Inactive",
              count: collections.length - activeCount,
            },
          ]}
        />
      </div>

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchCollections())}
      />

      {deleteLoading && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-(--radius) bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <span className="spinner spinner-sm" />
          <p className="text-[12.5px] text-amber-800 dark:text-amber-300">
            Hiding the collection — its products are not affected.
          </p>
        </div>
      )}

      {loading && collections.length === 0 ? (
        <TableSkeleton rows={6} columns={6} hasThumb />
      ) : (
        <CollectionTable
          collections={filtered}
          onEdit={handleOpenEdit}
          onCreate={handleOpenAdd}
          onView={setViewingCollection}
        />
      )}

      <CollectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />

      <CollectionProductsModal
        isOpen={!!viewingCollection}
        collection={viewingCollection}
        onClose={() => setViewingCollection(null)}
      />

      {/* CSV bulk import */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Import collections via CSV"
        subtitle="Upload a CSV file to add or update multiple collections at once."
        uploadHint={
          <>
            Required column: <b>name</b>. Optional: <b>description</b>,
            <b>showOnHomePage</b> (true/false), <b>showAsBadge</b> (true/false), <b>isActive</b> (true/false).
            Slugs are auto-generated from the name. Existing duplicate names will be skipped automatically.
          </>
        }
        onDownloadSample={downloadCollectionsSampleCsv}
        onSubmit={handleBulkUpload}
      />
    </div>
  );
};

export default CollectionsPage;

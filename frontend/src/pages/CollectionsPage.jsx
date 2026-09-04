import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCollections } from "../features/collections/collectionsSlice";

import CollectionTable from "../components/collections/CollectionTable";
import CollectionModal from "../components/collections/CollectionModal";
import PageHeader from "../components/common/PageHeader";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { PlusIcon } from "../components/common/Icon";

const CollectionsPage = () => {
  const dispatch = useDispatch();
  const { collections, loading, error, deleteLoading } = useSelector(
    (state) => state.collections,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  const activeCount = collections.filter((c) => c.isActive !== false).length;
  const automatedCount = collections.filter((c) => c.type === "automated").length;

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

  return (
    <div className="page-shell">
      <PageHeader
        title="Collections"
        subtitle="Curate products for marketing — badges, home sections aur shop filters."
        meta={
          <>
            <span className="meta-chip">
              <b>{collections.length}</b> total
            </span>
            <span className="meta-chip meta-chip-success">
              <b>{activeCount}</b> active
            </span>
            <span className="meta-chip">
              <b>{automatedCount}</b> automated
            </span>
          </>
        }
        actions={
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <PlusIcon className="w-4 h-4" />
            Add collection
          </button>
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
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-(--radius) bg-amber-50 border border-amber-200">
          <span className="spinner spinner-sm" />
          <p className="text-[12.5px] text-amber-800">
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
        />
      )}

      <CollectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
      />
    </div>
  );
};

export default CollectionsPage;

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  bulkCreateCategories,
  fetchCategories,
} from "../features/categories/categoriesSlice";
import { exportAllCategoriesToExcel } from "../utils/exportProductToExcel";
import { downloadCategoriesSampleCsv } from "../utils/csvTemplates";
import { notifyInfo } from "../lib/toast";

import CategoryTable from "../components/categories/CategoryTable";
import CategoryModal from "../components/categories/CategoryModal";
import PageHeader from "../components/common/PageHeader";
import BulkUploadModal from "../components/common/BulkUploadModal";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, PlusIcon, UploadIcon } from "../components/common/Icon";

const CategoriesPage = () => {
  const dispatch = useDispatch();
  const { categories, loading, error, deleteLoading } = useSelector(
    (state) => state.categories,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  // 🆕 Listing shortcut — "+" se aaya preset parent (form me locked)
  const [presetParent, setPresetParent] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const activeCount = categories.filter((c) => c.isActive).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = categories.filter((c) => {
      if (status === "active" && !c.isActive) return false;
      if (status === "inactive" && c.isActive) return false;
      return true;
    });
    if (!q) return base;

    // 🆕 Search — matches + unke saare ancestors auto-include (file-explorer
    // style: parent rows dikhte rehte hain aur auto-expand hote hain)
    const byId = new Map(categories.map((c) => [String(c._id), c]));
    const parentOf = (c) => {
      const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
      return pid ? byId.get(pid) : null;
    };
    const result = new Map();
    for (const c of base) {
      const hit =
        String(c.name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.slug || "")
          .toLowerCase()
          .includes(q) ||
        String(c.description || "")
          .toLowerCase()
          .includes(q);
      if (!hit) continue;
      result.set(String(c._id), c);
      let p = parentOf(c);
      while (p) {
        result.set(String(p._id), p);
        p = parentOf(p);
      }
    }
    return [...result.values()];
  }, [categories, search, status]);

  const handleOpenAdd = () => {
    setEditData(null);
    setPresetParent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditData(category);
    setPresetParent(null);
    setIsModalOpen(true);
  };

  // 🆕 Listing shortcut — "+" icon: New Category form with locked parent
  const handleAddSub = (parentCategory) => {
    setEditData(null);
    setPresetParent(parentCategory);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
    setPresetParent(null);
  };

  const handleExportAll = () => {
    if (!categories.length) {
      notifyInfo("Nothing to export", "Add a category first.");
      return;
    }
    exportAllCategoriesToExcel(categories);
  };

  // 🆕 CSV bulk-import — thunk resolve hone par summary object return hota hai
  const handleBulkUpload = async (formData) => {
    const result = await dispatch(bulkCreateCategories(formData));
    if (bulkCreateCategories.fulfilled.match(result)) {
      // Naye categories slice ke fulfilled case me list me merge ho gaye
      return result.payload;
    }
    throw new Error(result.payload || "Bulk import failed");
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Categories"
        subtitle="Group your catalog so shoppers can browse by category."
        meta={
          <>
            <span className="meta-chip">
              <b>{categories.length}</b> total
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
              title="Download all categories as Excel"
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
              Add category
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
            { value: null, label: "All", count: categories.length },
            { value: "active", label: "Active", count: activeCount },
            {
              value: "inactive",
              label: "Inactive",
              count: categories.length - activeCount,
            },
          ]}
        />
      </div>

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchCategories())}
      />

      {deleteLoading && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-(--radius) bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <span className="spinner spinner-sm" />
          <p className="text-[12.5px] text-amber-800 dark:text-amber-300">
            Hiding the category — its products are not affected.
          </p>
        </div>
      )}

      {loading && categories.length === 0 ? (
        <TableSkeleton rows={6} columns={5} hasThumb />
      ) : (
        <CategoryTable
          categories={filtered}
          onEdit={handleOpenEdit}
          onCreate={handleOpenAdd}
          searchActive={Boolean(search.trim())}
          onAddSub={handleAddSub}
        />
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
        presetParent={presetParent}
      />

      {/* 🆕 CSV bulk import */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Import categories via CSV"
        subtitle="Upload a CSV file to add or update multiple categories at once."
        uploadHint={
          <>
            Required column: <b>name</b>. Optional: <b>description</b>,
            <b>gender</b> (&quot;Men,Women&quot;), <b>isActive</b> (true/false).
            Slugs are auto-generated from the name. Existing duplicate names will be skipped automatically.
          </>
        }
        onDownloadSample={downloadCategoriesSampleCsv}
        onSubmit={handleBulkUpload}
      />
    </div>
  );
};

export default CategoriesPage;

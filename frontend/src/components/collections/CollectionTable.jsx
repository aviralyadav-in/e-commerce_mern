import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCollection,
  restoreCollection,
  toggleCollectionStatus,
} from "../../features/collections/collectionsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import {
  GridIcon,
  EyeIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
  PlusIcon,
  ExternalLinkIcon,
} from "../common/Icon";
import { getStorefrontUrl } from "../../utils/storefrontUrl";

const ACCESSORS = {
  name: (c) => c.name,
  products: (c) => c.productCount || 0,
  status: (c) => (c.isActive !== false ? 1 : 0),
};

const CollectionTable = ({ collections, onEdit, onCreate, onView }) => {
  const dispatch = useDispatch();
  const { deleteLoading } = useSelector((state) => state.collections);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const table = useTableControls(collections, {
    accessors: ACCESSORS,
    initialSort: { key: "name", dir: "asc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteCollection(deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-190">
            <thead>
              <tr>
                <SortableTh
                  label="Collection"
                  sortKey="name"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col">Description</th>
                
                <SortableTh
                  label="Products"
                  sortKey="products"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
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
                table.rows.map((col) => (
                  <tr
                    key={col._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Thumb
                          src={col.image}
                          alt={col.name}
                          className="w-10 h-10"
                          rounded="rounded-xl"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="cell-strong truncate text-[13px]">
                              {col.name}
                            </p>
                            {col.showOnHomePage === true && (
                              <span
                                className="shrink-0 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                                title="Featured on website home page under 'Featured Pieces'"
                              >
                                Home
                              </span>
                            )}
                            {col.showAsBadge === true && (
                              <span
                                className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                                title="Shown as a promotional badge on member product cards"
                              >
                                Badge
                              </span>
                            )}
                          </div>
                          <span className="cell-sub font-mono truncate text-slate-400 dark:text-slate-500 text-[11px]">
                            /{col.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-70">
                      <p className="line-clamp-2 text-slate-500 dark:text-slate-400 text-[12.5px]">
                        {col.description || "—"}
                      </p>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onView?.(col)}
                        className="inline-flex items-center gap-1.5 font-semibold text-[13px] text-(--ink-soft) hover:text-(--brand) cursor-pointer group"
                        title="View products in this collection"
                      >
                        <span className="tabular-nums font-bold text-(--ink)">
                          {col.productCount ?? 0}
                        </span>
                        <span className="text-[12px] text-(--ink-muted) group-hover:underline">
                          {(col.productCount ?? 0) === 1 ? "product" : "products"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => dispatch(toggleCollectionStatus(col._id))}
                        className={`meta-chip cursor-pointer transition-transform hover:scale-105 ${
                          col.isActive !== false ? "meta-chip-success" : ""
                        }`}
                        title={
                          col.isActive !== false
                            ? "Click to deactivate (hide from storefront)"
                            : "Click to activate"
                        }
                      >
                        <span className="badge-dot" />
                        {col.isActive !== false ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onView?.(col)}
                          className="icon-btn icon-btn-view"
                          title="View products"
                          aria-label={`View products in ${col.name}`}
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(col)}
                          className="icon-btn icon-btn-edit"
                          title="Edit collection"
                          aria-label={`Edit ${col.name}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={getStorefrontUrl(`/shop?collections=${col._id}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View collection on Live Storefront"
                          aria-label={`View ${col.name} on live storefront`}
                          className="icon-btn icon-btn-view text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50! dark:hover:bg-indigo-950/40!"
                        >
                          <ExternalLinkIcon className="w-3.5 h-3.5" />
                        </a>
                        {col.isActive === false && (
                          <button
                            onClick={() =>
                              dispatch(restoreCollection(col._id))
                            }
                            className="icon-btn icon-btn-view"
                            title="Restore collection"
                            aria-label={`Restore ${col.name}`}
                          >
                            <RefreshIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(col)}
                          disabled={deleteLoading}
                          className="icon-btn icon-btn-delete"
                          title="Hide collection"
                          aria-label={`Hide ${col.name}`}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    <EmptyState
                      icon={<GridIcon className="w-5 h-5" />}
                      title="No collections yet"
                      message="Curate products for marketing campaigns, homepage showcases, and promotional badges. Create your first collection to get started."
                      action={
                        onCreate && (
                          <button
                            onClick={onCreate}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add collection
                          </button>
                        )
                      }
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
          noun="collections"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hide collection?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be hidden from the storefront. Its products are NOT deleted — you can restore it anytime from the Inactive filter.`
            : ""
        }
        confirmLabel="Hide collection"
        variant="danger"
        busy={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default CollectionTable;

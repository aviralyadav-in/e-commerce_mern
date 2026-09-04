import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCollection,
  restoreCollection,
} from "../../features/collections/collectionsSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import {
  GridIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
  PlusIcon,
} from "../common/Icon";

const OPERATOR_LABELS = {
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  eq: "=",
  withinDays: "last",
};
const FIELD_LABELS = {
  price: "Price",
  stock: "Stock",
  createdAt: "Created",
  subCategory: "Dept",
};

// Automated collection ke rules ka human-readable summary
const describeRules = (rules = []) =>
  rules
    .map((r) => {
      if (r.field === "createdAt" && r.operator === "withinDays")
        return `Created within ${r.value} days`;
      if (r.field === "subCategory") return `Dept = ${r.value}`;
      return `${FIELD_LABELS[r.field] || r.field} ${
        OPERATOR_LABELS[r.operator] || r.operator
      } ${r.value}`;
    })
    .join(" AND ");

const ACCESSORS = {
  name: (c) => c.name,
  products: (c) => c.productCount || 0,
  status: (c) => (c.isActive !== false ? 1 : 0),
};

const CollectionTable = ({ collections, onEdit, onCreate }) => {
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
                <th scope="col">Type</th>
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
                    className="hover:bg-slate-50/80 transition-colors"
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
                          <div className="flex items-center gap-1.5">
                            <p className="cell-strong truncate text-[13px]">
                              {col.name}
                            </p>
                            {col.showOnHomePage === true && (
                              <span
                                className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                                title="Featured on website home page"
                              >
                                Home
                              </span>
                            )}
                            {col.showAsBadge === true && (
                              <span
                                className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                                title="Shown as badge on product cards"
                              >
                                Badge
                              </span>
                            )}
                          </div>
                          <span className="cell-sub font-mono truncate text-slate-400 text-[11px]">
                            /{col.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-70">
                      <p className="line-clamp-2 text-slate-500 text-[12.5px]">
                        {col.description || "—"}
                      </p>
                    </td>
                    <td>
                      {col.type === "automated" ? (
                        <div className="min-w-0">
                          <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            Automated
                          </span>
                          <p
                            className="mt-0.5 truncate text-[11px] text-slate-400"
                            title={describeRules(col.rules)}
                          >
                            {describeRules(col.rules) || "No rules"}
                          </p>
                        </div>
                      ) : (
                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Manual
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="cell-strong text-[13px]">
                        {col.productCount ?? "—"}
                      </span>
                    </td>
                    <td>
                      {col.isActive !== false ? (
                        <span className="meta-chip meta-chip-success">
                          Active
                        </span>
                      ) : (
                        <span className="meta-chip">Hidden</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(col)}
                          className="icon-btn icon-btn-edit"
                          title="Edit collection"
                          aria-label={`Edit ${col.name}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
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
                  <td colSpan="6" className="empty-cell">
                    <EmptyState
                      icon={<GridIcon className="w-5 h-5" />}
                      title="No collections yet"
                      message="Collections curate products for marketing — badges, home sections aur shop filters. Create the first one to get started."
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

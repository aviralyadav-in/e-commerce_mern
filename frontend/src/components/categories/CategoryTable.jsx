import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteCategory } from "../../features/categories/categoriesSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { GridIcon, PencilIcon, TrashIcon, PlusIcon } from "../common/Icon";

const ACCESSORS = {
  name: (c) => c.name,
  status: (c) => (c.isActive !== false ? 1 : 0),
  subs: (c) => c.subCategories?.length ?? 2,
};

const CategoryTable = ({ categories, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const { deleteLoading } = useSelector((state) => state.categories);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const table = useTableControls(categories, {
    accessors: ACCESSORS,
    initialSort: { key: "name", dir: "asc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteCategory(deleteTarget._id));
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
                  label="Category"
                  sortKey="name"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col">Description</th>
                <SortableTh
                  label="Sub-categories"
                  sortKey="subs"
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
                table.rows.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <Thumb
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10"
                          rounded="rounded-xl"
                        />
                        <div className="min-w-0">
                          <p className="cell-strong truncate text-[13px]">{cat.name}</p>
                          <span className="cell-sub font-mono truncate text-slate-400 text-[11px]">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-70">
                      <p className="line-clamp-2 text-slate-500 text-[12.5px]">
                        {cat.description || "—"}
                      </p>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {(cat.subCategories?.length
                          ? cat.subCategories
                          : ["Men", "Women"]
                        ).map((sub) => (
                          <span
                            key={sub}
                            className={`badge ${
                              sub === "Men" ? "badge-info" : "badge-pink"
                            }`}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          cat.isActive !== false
                            ? "badge-success"
                            : "badge-neutral"
                        }`}
                      >
                        <span className="badge-dot" />
                        {cat.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(cat)}
                          className="icon-btn icon-btn-edit"
                          title="Edit category"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          disabled={deleteLoading}
                          className="icon-btn icon-btn-delete"
                          title="Delete category"
                          aria-label={`Delete ${cat.name}`}
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
                      title="No categories yet"
                      message="Categories group your products in the storefront. Create the first one to start adding products."
                      action={
                        onCreate && (
                          <button
                            onClick={onCreate}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add category
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
          noun="categories"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete category?"
        message={
          deleteTarget
            ? `Deleting “${deleteTarget.name}” also removes every product inside it. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete category"
        variant="danger"
        busy={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default CategoryTable;

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteBanner } from "../../features/banners/bannersSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { ImageIcon, PencilIcon, TrashIcon, PlusIcon } from "../common/Icon";

const ACCESSORS = {
  title: (b) => b.title,
  status: (b) => (b.isActive ? 1 : 0),
  sortOrder: (b) => b.sortOrder || 0,
};

const BannerTable = ({ banners, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const table = useTableControls(banners, {
    accessors: ACCESSORS,
    initialSort: { key: "sortOrder", dir: "asc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteBanner(deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-180">
            <thead>
              <tr>
                <th scope="col">Preview</th>
                <SortableTh
                  label="Banner"
                  sortKey="title"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Status"
                  sortKey="status"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Order"
                  sortKey="sortOrder"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.length > 0 ? (
                table.rows.map((banner) => (
                  <tr key={banner._id}>
                    <td className="w-35">
                      <Thumb
                        src={banner.image}
                        alt={banner.title}
                        className="w-24 h-12"
                      />
                    </td>
                    <td>
                      <p className="cell-strong truncate max-w-70">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <span className="cell-sub truncate max-w-70">
                          {banner.subtitle}
                        </span>
                      )}
                      {banner.linkUrl && (
                        <span className="cell-sub truncate max-w-70 text-(--brand)">
                          {banner.linkUrl}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-dot ${
                          banner.isActive ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className="code-chip">{banner.sortOrder || 0}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(banner)}
                          title="Edit banner"
                          aria-label={`Edit ${banner.title}`}
                          className="icon-btn icon-btn-edit"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(banner)}
                          title="Delete banner"
                          aria-label={`Delete ${banner.title}`}
                          className="icon-btn icon-btn-delete"
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
                      icon={<ImageIcon className="w-5 h-5" />}
                      title="No banners yet"
                      message="Banners appear on the storefront home page. Add one to promote a collection or sale."
                      action={
                        onCreate && (
                          <button
                            onClick={onCreate}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add banner
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
          noun="banners"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete banner?"
        message={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from the storefront. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete banner"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default BannerTable;

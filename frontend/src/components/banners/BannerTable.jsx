import { useState } from "react";
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

const PAGE_LABELS = { home: "Home", shop: "Shop", wishlist: "Wishlist" };
const PAGE_BADGE_CLASSES = {
  home: "badge-indigo",
  shop: "badge-brand",
  wishlist: "badge-pink",
};
const POSITION_LABELS = {
  "after-hero": "After hero (Top)",
  "after-products": "After products (Bottom)",
};

const BannerTable = ({ banners, onEdit, onCreate, onToggleStatus }) => {
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
                <th scope="col">Page / Slot</th>
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
                  <tr
                    key={banner._id}
                    className="hover:bg-(--surface-sunken)/70 transition-colors"
                  >
                    <td className="w-36">
                      <Thumb
                        src={banner.image}
                        alt={banner.title}
                        className="w-24 h-12"
                        rounded="rounded-xl"
                      />
                    </td>
                    <td>
                      <p className="cell-strong truncate max-w-70 text-[13px]">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <span className="cell-sub truncate max-w-70 text-(--ink-muted) text-[11.5px]">
                          {banner.subtitle}
                        </span>
                      )}
                      {banner.linkUrl && (
                        <span className="cell-sub truncate max-w-70 text-(--brand) font-medium text-[11px] block mt-0.5">
                          {banner.linkUrl}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <span
                        className={`badge ${
                          PAGE_BADGE_CLASSES[banner.page] || "badge-info"
                        } capitalize font-semibold`}
                      >
                        {PAGE_LABELS[banner.page] || banner.page || "Home"}
                      </span>
                      {banner.position && (
                        <span className="cell-sub text-(--ink-faint) text-[11px] block mt-1">
                          {POSITION_LABELS[banner.position] || banner.position}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onToggleStatus && onToggleStatus(banner._id)}
                        className={`badge ${
                          banner.isActive ? "badge-success" : "badge-neutral"
                        } cursor-pointer hover:opacity-80 transition-opacity`}
                        title={`Click to ${banner.isActive ? "deactivate" : "activate"} banner`}
                        aria-label={`Toggle status for ${banner.title}`}
                      >
                        <span className="badge-dot" />
                        {banner.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="text-right font-mono font-bold text-(--ink) text-[12.5px]">
                      #{banner.sortOrder ?? 0}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(banner)}
                          className="icon-btn icon-btn-edit"
                          title="Edit banner"
                          aria-label={`Edit ${banner.title}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(banner)}
                          className="icon-btn icon-btn-delete"
                          title="Delete banner"
                          aria-label={`Delete ${banner.title}`}
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
                      icon={<ImageIcon className="w-5 h-5" />}
                      title="No banners yet"
                      message="Banners appear on the storefront (home, shop or wishlist page). Add one to promote a collection or sale."
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
            ? `“${deleteTarget.title}” will be permanently removed from the storefront. You can also mark it as Inactive instead if you want to keep it for later.`
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

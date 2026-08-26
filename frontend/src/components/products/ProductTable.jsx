import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct } from "../../features/products/productsSlice";
import { exportProductToExcel } from "../../utils/exportProductToExcel";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { formatCurrency } from "../../utils/format";
import {
  BagIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  StarFilledIcon,
  TrashIcon,
} from "../common/Icon";

/** Below this many units we nudge the admin to restock. */
const LOW_STOCK = 5;

const ProductTable = ({ products, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const getCategoryName = (id) => {
    if (typeof id === "object" && id?.name) return id.name;
    const catId = typeof id === "object" ? id?._id : id;
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.name : "Unknown";
  };

  const table = useTableControls(products, {
    accessors: {
      name: (p) => p.name || "",
      category: (p) => getCategoryName(p.categoryId),
      sub: (p) => p.subCategory || "",
      price: (p) => Number(p.discountPrice || p.price) || 0,
      stock: (p) => Number(p.stock) || 0,
      rating: (p) => Number(p.averageRating) || 0,
    },
    initialSort: { key: "name", dir: "asc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteProduct(deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-245">
            <thead>
              <tr>
                <SortableTh
                  label="Product"
                  sortKey="name"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Category"
                  sortKey="category"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Segment"
                  sortKey="sub"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Price"
                  sortKey="price"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Stock"
                  sortKey="stock"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Rating"
                  sortKey="rating"
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
                table.rows.map((prod) => {
                  const stock = prod.stock ?? 0;
                  const hasDiscount =
                    prod.discountPrice != null && prod.discountPrice > 0;

                  return (
                    <tr key={prod._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Thumb
                            src={prod.images?.desktop?.[0]}
                            alt={prod.name}
                            className="w-9 h-9"
                          />
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-47.5">
                              {prod.name}
                            </p>
                            <span className="cell-sub truncate max-w-47.5">
                              {prod.brand || prod.material || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {getCategoryName(prod.categoryId)}
                      </td>
                      <td>
                        <span className="badge badge-neutral capitalize">
                          {prod.subCategory || "Unisex"}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {hasDiscount ? (
                          <>
                            <p className="cell-strong text-emerald-700">
                              {formatCurrency(prod.discountPrice)}
                            </p>
                            <span className="cell-sub line-through">
                              {formatCurrency(prod.price)}
                            </span>
                          </>
                        ) : (
                          <p className="cell-strong">
                            {formatCurrency(prod.price)}
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              stock === 0
                                ? "text-red-600"
                                : stock <= LOW_STOCK
                                  ? "text-amber-600"
                                  : "text-(--ink)"
                            }`}
                          >
                            {stock}
                          </span>
                          {!prod.isActive ? (
                            <span className="badge badge-neutral">Hidden</span>
                          ) : stock === 0 ? (
                            <span className="badge badge-danger">
                              Out of stock
                            </span>
                          ) : stock <= LOW_STOCK ? (
                            <span className="badge badge-warning">Low</span>
                          ) : (
                            <span className="badge badge-success">Live</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <StarFilledIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span className="cell-strong">
                            {(prod.averageRating ?? 0).toFixed(1)}
                          </span>
                        </div>
                        <span className="cell-sub">
                          {prod.numOfReviews ?? 0} review
                          {(prod.numOfReviews ?? 0) === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() =>
                              exportProductToExcel(
                                prod,
                                getCategoryName(prod.categoryId),
                              )
                            }
                            title="Export to Excel"
                            aria-label={`Export ${prod.name}`}
                            className="icon-btn icon-btn-download"
                          >
                            <DownloadIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEdit(prod)}
                            title="Edit product"
                            aria-label={`Edit ${prod.name}`}
                            className="icon-btn icon-btn-edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(prod)}
                            title="Delete product"
                            aria-label={`Delete ${prod.name}`}
                            className="icon-btn icon-btn-delete"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    <EmptyState
                      icon={<BagIcon className="w-5 h-5" />}
                      title="No products found"
                      message="Add your first bag to the catalog, or clear the filters to see everything."
                      action={
                        onCreate && (
                          <button
                            onClick={onCreate}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add product
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
          noun="products"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete product?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed from your catalog. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete product"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ProductTable;

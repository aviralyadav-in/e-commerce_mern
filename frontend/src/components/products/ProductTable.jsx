import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteProduct,
  restoreProduct,
} from "../../features/products/productsSlice";
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
  RefreshIcon,
  StarFilledIcon,
  TrashIcon,
  ExternalLinkIcon,
} from "../common/Icon";
import { getStorefrontUrl } from "../../utils/storefrontUrl";

/** Below this many units we nudge the admin to restock. */
const LOW_STOCK = 5;

const ProductTable = ({
  products,
  onEdit,
  onCreate,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
}) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const { collections: allCollections } = useSelector(
    (state) => state.collections,
  );
  const [deleteTarget, setDeleteTarget] = useState(null);

  const getCategoryName = (id) => {
    if (typeof id === "object" && id?.name) return id.name;
    const catId = typeof id === "object" ? id?._id : id;
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.name : "Unknown";
  };

  const getCollectionNames = (prod) => {
    const arr = Array.isArray(prod.collections) ? prod.collections : [];
    const names = arr
      .map((c) => {
        if (typeof c === "object" && c?.name) return c.name;
        const id = typeof c === "object" ? c?._id : c;
        const col = (allCollections || []).find(
          (x) => String(x._id) === String(id),
        );
        return col ? col.name : null;
      })
      .filter(Boolean);
    return [...new Set(names)];
  };

  const table = useTableControls(products, {
    accessors: {
      name: (p) => p.name || "",
      category: (p) => getCategoryName(p.categoryId),
      sub: (p) => {
        const g = p.gender ?? p.subCategory;
        return Array.isArray(g) ? g.join(", ") : g || "";
      },
      collections: (p) => getCollectionNames(p).join(", "),
      price: (p) => Number(p.discountPrice || p.price) || 0,
      stock: (p) => Number(p.stock) || 0,
      rating: (p) => Number(p.averageRating) || 0,
    },
    initialSort: { key: "name", dir: "asc" },
    pageSize: 10,
  });

  const selectAllRef = useRef(null);
  const pageProducts = table.rows;
  const allSelected =
    pageProducts.length > 0 &&
    pageProducts.every((p) => selectedIds.has(String(p._id)));
  const someSelected = pageProducts.some((p) =>
    selectedIds.has(String(p._id)),
  );

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

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
                <th scope="col" className="w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-(--brand)"
                    checked={allSelected}
                    onChange={() => onToggleSelectAll?.(pageProducts)}
                    aria-label="Select all products on this page"
                  />
                </th>
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
                  label="Collections"
                  sortKey="collections"
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
                  const collectionNames = getCollectionNames(prod);
                  const hasDiscount =
                    prod.discountPrice != null && prod.discountPrice > 0;
                  const isSelected = selectedIds.has(String(prod._id));

                  return (
                    <tr
                      key={prod._id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-(--brand-soft)"
                          : "hover:bg-(--surface-sunken)/70"
                      }`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-(--brand)"
                          checked={isSelected}
                          onChange={() => onToggleSelect?.(prod)}
                          aria-label={`Select ${prod.name}`}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Thumb
                            src={prod.images?.desktop?.[0]}
                            alt={prod.name}
                            className="w-10 h-10"
                            rounded="rounded-xl"
                          />
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-55 text-[13px]">
                              {prod.name}
                            </p>
                            <span className="cell-sub truncate max-w-55 text-(--ink-faint)">
                              {prod.brand || prod.material || "Standard"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap font-medium text-(--ink-soft)">
                        {getCategoryName(prod.categoryId)}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            Array.isArray(prod.gender ?? prod.subCategory) &&
                            (prod.gender ?? prod.subCategory).length
                              ? prod.gender ?? prod.subCategory
                              : (prod.gender ?? prod.subCategory)
                                ? [prod.gender ?? prod.subCategory]
                                : ["Men"]
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
                        <div className="flex flex-wrap gap-1 max-w-45">
                          {collectionNames.length ? (
                            <>
                              {collectionNames.slice(0, 2).map((n) => (
                                <span
                                  key={n}
                                  className="badge badge-brand max-w-35 truncate"
                                  title={n}
                                >
                                  {n}
                                </span>
                              ))}
                              {collectionNames.length > 2 && (
                                <span
                                  className="badge"
                                  title={collectionNames.join(", ")}
                                >
                                  +{collectionNames.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[12px] text-(--ink-faint)">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {hasDiscount ? (
                          <>
                            <p className="cell-strong text-emerald-600 font-bold">
                              {formatCurrency(prod.discountPrice)}
                            </p>
                            <span className="cell-sub line-through text-(--ink-faint) text-[11px]">
                              {formatCurrency(prod.price)}
                            </span>
                          </>
                        ) : (
                          <p className="cell-strong text-(--ink) font-bold">
                            {formatCurrency(prod.price)}
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold tabular-nums text-[13px] ${
                              stock === 0
                                ? "text-rose-600"
                                : stock <= LOW_STOCK
                                  ? "text-amber-600"
                                  : "text-(--ink)"
                            }`}
                          >
                            {stock}
                          </span>
                          {!prod.isActive ? (
                            <span className="badge badge-neutral">
                              <span className="badge-dot" /> Hidden
                            </span>
                          ) : stock === 0 ? (
                            <span className="badge badge-danger">
                              <span className="badge-dot" /> Out of stock
                            </span>
                          ) : stock <= LOW_STOCK ? (
                            <span className="badge badge-warning">
                              <span className="badge-dot" /> Low
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              <span className="badge-dot" /> In Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 font-bold text-(--ink)">
                          <StarFilledIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {(prod.averageRating ?? 0).toFixed(1)}
                          </span>
                        </div>
                        <span className="cell-sub text-(--ink-faint) text-[11px]">
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
                          <a
                            href={getStorefrontUrl(`/product/${prod._id}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Live Storefront"
                            aria-label={`View ${prod.name} on live storefront`}
                            className="icon-btn icon-btn-view text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50! dark:hover:bg-indigo-950/40!"
                          >
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </a>
                          {prod.isActive === false && (
                            <button
                              onClick={() => dispatch(restoreProduct(prod._id))}
                              title="Restore product"
                              aria-label={`Restore ${prod.name}`}
                              className="icon-btn icon-btn-view"
                            >
                              <RefreshIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(prod)}
                            title="Hide product"
                            aria-label={`Hide ${prod.name}`}
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
                  <td colSpan="9" className="empty-cell">
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
        title="Hide product?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be hidden from the storefront. Nothing is permanently deleted — order history stays intact and you can restore it anytime.`
            : ""
        }
        confirmLabel="Hide product"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ProductTable;

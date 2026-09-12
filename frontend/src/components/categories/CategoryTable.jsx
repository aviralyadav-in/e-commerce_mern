import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategory,
  restoreCategory,
  toggleCategoryStatus,
} from "../../features/categories/categoriesSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import {
  ChevronDownIcon,
  GridIcon,
  PencilIcon,
  RefreshIcon,
  TrashIcon,
  PlusIcon,
  ExternalLinkIcon,
} from "../common/Icon";
import { getStorefrontUrl } from "../../utils/storefrontUrl";

const ACCESSORS = {
  name: (c) => c.name,
  status: (c) => (c.isActive !== false ? 1 : 0),
  subs: (c) => c.gender?.length ?? c.subCategories?.length ?? 2,
};

const CategoryTable = ({
  categories,
  onEdit,
  onCreate,
  searchActive = false,
  onAddSub,
}) => {
  const dispatch = useDispatch();
  const { deleteLoading } = useSelector((state) => state.categories);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 🆕 TREE VIEW — filtered categories ko parent→children groups me
  // organize karte hain. Parent filtered list me na ho (search sirf child
  // se match hua) toh child root row ban jata hai — kuch bhi invisible
  // nahi hota. Pagination parents pe — children hamesha saath me.
  const parentKeyOf = (c) => {
    const pid = typeof c.parentId === "object" ? c.parentId?._id : c.parentId;
    return pid ? String(pid) : null;
  };

  const listedIds = new Set(categories.map((c) => String(c._id)));
  const childGroups = {}; // parentId -> children (name asc)
  const roots = [];
  categories.forEach((c) => {
    const key = parentKeyOf(c);
    if (key && listedIds.has(key)) {
      (childGroups[key] ||= []).push(c);
    } else {
      roots.push(c);
    }
  });
  Object.values(childGroups).forEach((group) =>
    group.sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
    ),
  );

  const table = useTableControls(roots, {
    accessors: ACCESSORS,
    initialSort: { key: "name", dir: "asc" },
    pageSize: 10,
  });

  // 🆕 Expand/collapse — default sab expanded
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  // 🆕 Search active — matching results ke saare parents auto-expand
  useEffect(() => {
    if (searchActive) setCollapsedIds(new Set());
  }, [searchActive]);

  // 🛠️ Inherited-hidden detection — parent inactive ho toh khud-active
  // children bhi storefront par hidden hote hain (ancestor-chain check).
  // Admin ko clear dikhane ke liye aisi rows par "Hidden via parent" badge.
  const hiddenByParentIds = useMemo(() => {
    const parentMap = new Map(
      categories.map((c) => [
        String(c._id),
        c.parentId ? String(c.parentId._id || c.parentId) : null,
      ]),
    );
    const inactive = new Set(
      categories
        .filter((c) => c.isActive === false)
        .map((c) => String(c._id)),
    );
    const hidden = new Set();
    for (const c of categories) {
      if (c.isActive === false) continue; // khud inactive — apna badge kaafi hai
      let cur = parentMap.get(String(c._id));
      const seen = new Set();
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        if (inactive.has(cur)) {
          hidden.add(String(c._id));
          break;
        }
        cur = parentMap.get(cur);
      }
    }
    return hidden;
  }, [categories]);

  const isCollapsed = (id) => collapsedIds.has(String(id));
  const toggleCollapse = (id) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allParentIds = useMemo(() => {
    return Object.keys(childGroups);
  }, [childGroups]);

  const collapseAll = () => setCollapsedIds(new Set(allParentIds));
  const expandAll = () => setCollapsedIds(new Set());

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteCategory(deleteTarget._id));
    setDeleteTarget(null);
  };

  // 🆕 Recursive tree render with ancestors path
  const renderTree = (cat, depth = 0, ancestors = []) => {
    const kids = childGroups[String(cat._id)] || [];
    const open = kids.length > 0 && !isCollapsed(String(cat._id));
    return (
      <Fragment key={cat._id}>
        {renderRow(cat, { kids, open, depth, ancestors })}
        {open &&
          kids.map((child) =>
            renderTree(child, depth + 1, [...ancestors, cat.name]),
          )}
      </Fragment>
    );
  };

  // 🆕 Hierarchy row renderer with distinct visual styles per level
  const renderRow = (cat, opts = {}) => {
    const {
      kids = [],
      open = false,
      depth = 0,
      ancestors = [],
    } = opts;

    // Spec indent: 0px (root) / 32px (child) / 64px (sub-child)
    const indentPadding =
      depth >= 2 ? "pl-14" : depth === 1 ? "pl-7" : "pl-0";

    // Level-based row styling
    const rowClass =
      depth >= 2
        ? "tree-row-sub"
        : depth === 1
          ? "tree-row-child"
          : "tree-row-root";

    const nameClass =
      depth >= 2
        ? "tree-name-sub text-[12.5px]"
        : depth === 1
          ? "tree-name-child text-[13px]"
          : "tree-name-root text-[13.5px]";

    return (
      <tr className={rowClass}>
        <td>
          <div className={`relative flex items-center gap-2.5 ${indentPadding}`}>
            {/* Tree Branch Connectors */}
            {depth === 1 && (
              <svg
                className="w-4 h-4 text-sky-500/70 dark:text-sky-400/80 shrink-0 select-none"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path
                  d="M4 0v8a3 3 0 003 3h7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {depth >= 2 && (
              <div
                className="flex items-center gap-0.5 shrink-0 select-none text-amber-500/80 dark:text-amber-400/80"
                aria-hidden="true"
              >
                <span className="w-2.5 border-b-2 border-dashed border-amber-300/80 dark:border-amber-400/60" />
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path
                    d="M4 0v8a3 3 0 003 3h7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Expand/Collapse Toggle Button for ANY level that has children */}
            {kids.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleCollapse(String(cat._id))}
                className="w-5 h-5 shrink-0 rounded flex items-center justify-center text-slate-400 hover:text-(--brand) hover:bg-(--brand-soft) transition-colors cursor-pointer"
                title={open ? "Collapse sub-categories" : "Expand sub-categories"}
                aria-expanded={open}
              >
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform ${
                    open ? "" : "-rotate-90"
                  }`}
                />
              </button>
            ) : (
              <span className="w-5 h-5 shrink-0" />
            )}

            <Thumb
              src={cat.image}
              alt={cat.name}
              className={
                depth >= 2 ? "w-8 h-8" : depth === 1 ? "w-9 h-9" : "w-10 h-10"
              }
              rounded={
                depth >= 2 ? "rounded-md" : depth === 1 ? "rounded-lg" : "rounded-xl"
              }
            />

            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-1.5">
                <p className={`truncate ${nameClass}`}>
                  {cat.name}
                </p>

                {/* 🏷️ Distinct Hierarchy Level Badge */}
                {depth === 0 ? (
                  <span
                    className="badge-hierarchy-root shrink-0"
                    title="Main / Top-level Category"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Main Category
                  </span>
                ) : depth === 1 ? (
                  <span
                    className="badge-hierarchy-child shrink-0"
                    title="Sub-Category under parent"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Sub-Category
                  </span>
                ) : (
                  <span
                    className="badge-hierarchy-sub shrink-0"
                    title="Nested Sub-Child Category"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Sub-Child
                  </span>
                )}

                {/* Kids count badge */}
                {depth === 0 && kids.length > 0 && (
                  <span
                    className="badge badge-brand shrink-0"
                    title={`${kids.length} sub-categories`}
                  >
                    {kids.length}{" "}
                    {kids.length === 1 ? "sub-category" : "sub-categories"}
                  </span>
                )}

                {depth === 1 && kids.length > 0 && (
                  <span
                    className="badge badge-warning shrink-0"
                    title={`${kids.length} sub-child categories`}
                  >
                    {kids.length}{" "}
                    {kids.length === 1 ? "sub-child" : "sub-children"}
                  </span>
                )}

                {/* Aggregated or own product count */}
                <span
                  className="badge badge-neutral shrink-0"
                  title={
                    kids.length > 0
                      ? `${cat.totalProductCount ?? cat.productCount ?? 0} products (own + all sub-categories)`
                      : `${cat.productCount ?? 0} products in this category`
                  }
                >
                  {kids.length > 0
                    ? cat.totalProductCount ?? cat.productCount ?? 0
                    : cat.productCount ?? 0}{" "}
                  {(kids.length > 0
                    ? cat.totalProductCount ?? cat.productCount ?? 0
                    : cat.productCount ?? 0) === 1
                    ? "product"
                    : "products"}
                </span>
              </div>

              {/* Slug, Breadcrumb Lineage, and Sort Order */}
              <div className="flex items-center flex-wrap gap-1.5 min-w-0 mt-0.5">
                <span className="cell-sub font-mono truncate text-slate-400 dark:text-slate-500 text-[11px]">
                  /{cat.slug}
                </span>

                {depth === 1 && ancestors.length > 0 && (
                  <span className="cell-sub text-slate-500 dark:text-slate-400 text-[11px]">
                    · under <strong className="font-semibold text-slate-700 dark:text-slate-200">{ancestors[0]}</strong>
                  </span>
                )}

                {depth >= 2 && ancestors.length >= 2 && (
                  <span className="tree-breadcrumb-pill">
                    <span>{ancestors[0]}</span>
                    <span className="text-slate-400 dark:text-slate-500">›</span>
                    <strong className="font-semibold text-slate-700 dark:text-slate-200">{ancestors[1]}</strong>
                  </span>
                )}

                <span
                  className="cell-sub shrink-0 text-slate-400 dark:text-slate-500 text-[11px]"
                  title="Sort order — lower numbers appear first in storefront listings"
                >
                  · #{cat.sortOrder ?? 0}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="max-w-70">
          <p className="line-clamp-2 text-slate-500 dark:text-slate-400 text-[12.5px]">
            {cat.description || "—"}
          </p>
        </td>
        <td>
          <div className="flex flex-wrap gap-1.5">
            {((cat.gender ?? cat.subCategories)?.length
              ? cat.gender ?? cat.subCategories
              : ["Men", "Women"]
            ).map((sub) => (
              <span
                key={sub}
                className={`badge ${sub === "Men" ? "badge-info" : "badge-pink"}`}
              >
                {sub}
              </span>
            ))}
          </div>
        </td>
        <td>
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => dispatch(toggleCategoryStatus(cat._id))}
              className={`badge cursor-pointer ${
                cat.isActive !== false ? "badge-success" : "badge-neutral"
              }`}
              title={
                cat.isActive !== false
                  ? "Click to deactivate (hide from storefront)"
                  : "Click to activate"
              }
            >
              <span className="badge-dot" />
              {cat.isActive !== false ? "Active" : "Inactive"}
            </button>
            {/* 🛠️ Parent inactive → ye row storefront par hidden hai (inherit) */}
            {hiddenByParentIds.has(String(cat._id)) && (
              <span
                className="badge badge-neutral"
                title="Hidden on storefront because its parent category is inactive"
              >
                Hidden via parent
              </span>
            )}
          </div>
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
            <a
              href={getStorefrontUrl(`/shop?categoryId=${cat._id}`)}
              target="_blank"
              rel="noopener noreferrer"
              title="View category on Live Storefront"
              aria-label={`View ${cat.name} on live storefront`}
              className="icon-btn icon-btn-view text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50! dark:hover:bg-indigo-950/40!"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
            {/* Add sub-category / sub-child shortcut */}
            {depth < 2 && onAddSub && (
              <button
                onClick={() => onAddSub(cat)}
                className="icon-btn icon-btn-view"
                title={depth === 0 ? `Add sub-category under ${cat.name}` : `Add sub-child under ${cat.name}`}
                aria-label={depth === 0 ? `Add sub-category under ${cat.name}` : `Add sub-child under ${cat.name}`}
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {cat.isActive === false && (
              <button
                onClick={() => dispatch(restoreCategory(cat._id))}
                className="icon-btn icon-btn-view"
                title="Restore category"
                aria-label={`Restore ${cat.name}`}
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setDeleteTarget(cat)}
              disabled={deleteLoading}
              className="icon-btn icon-btn-delete"
              title="Hide category"
              aria-label={`Hide ${cat.name}`}
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      {/* 🆕 Hierarchy legend & tree expand/collapse controls */}
      {table.rows.length > 0 && (
        <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2 px-1">
          <div className="flex items-center gap-3 text-[12px] text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">
              Hierarchy:
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
              Main
            </span>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-xs" />
              Sub-Category
            </span>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
              Sub-Child
            </span>
          </div>

          <button
            type="button"
            onClick={collapsedIds.size ? expandAll : collapseAll}
            className="text-[11.5px] font-semibold text-(--ink-muted) hover:text-(--brand) cursor-pointer flex items-center gap-1"
          >
            <span>{collapsedIds.size ? "⊞ Expand all levels" : "⊟ Collapse all levels"}</span>
          </button>
        </div>
      )}
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
                  label="Gender"
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
                table.rows.map((cat) => renderTree(cat, 0, []))
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
        title="Hide category?"
        message={
          deleteTarget
            ? childGroups[String(deleteTarget._id)]?.length
              ? `“${deleteTarget.name}” has ${
                  childGroups[String(deleteTarget._id)].length
                } child categor${
                  childGroups[String(deleteTarget._id)].length === 1
                    ? "y"
                    : "ies"
                } — Deleting is blocked until its sub-categories are reassigned or removed first (use Edit to change their parent).`
              : `“${deleteTarget.name}” will be hidden from the storefront.${
                  deleteTarget.productCount
                    ? ` ${deleteTarget.productCount} product(s) assigned.`
                    : ""
                } Assigned products are NOT deleted — you can restore this category anytime from the Inactive filter.`
            : ""
        }
        confirmLabel="Hide category"
        variant="danger"
        busy={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default CategoryTable;

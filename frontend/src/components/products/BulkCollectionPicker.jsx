import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Drawer from "../common/Drawer";
import Thumb from "../common/Thumb";
import { GridIcon } from "../common/Icon";
import {
  addCollection,
  bulkAddProducts,
  fetchCollections,
} from "../../features/collections/collectionsSlice";
import { notifySuccess, notifyError } from "../../lib/toast";

/**
 * 🆕 Bulk Collection Picker — products table ke bulk action bar se khulta hai.
 * Kisi bhi collection par click → saare selected products usme add ho jate
 * hain (row spinner ke saath). Drawer reuse — project ka standard slide-over.
 */
const BulkCollectionPicker = ({ isOpen, onClose, selectedIds, onDone }) => {
  const dispatch = useDispatch();
  const { collections, bulkAddLoadingId } = useSelector(
    (state) => state.collections,
  );
  const { products } = useSelector((state) => state.products);

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const productIds = [...selectedIds];

  // Sirf active collections + live search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections
      .filter((c) => c.isActive !== false)
      .filter((c) => !q || String(c.name || "").toLowerCase().includes(q));
  }, [collections, search]);

  // "already contains M of the selected" — client-side (products rows me
  // collections populated aati hai, extra API call ki zaroorat nahi)
  const alreadyCount = (colId) =>
    products.filter(
      (p) =>
        selectedIds.has(String(p._id)) &&
        (p.collections || []).some(
          (c) => String(c?._id ?? c) === String(colId),
        ),
    ).length;

  const handleError = (msg) => {
    setInlineError(msg);
    notifyError("Bulk add failed", msg);
  };

  // Collection row click → turant add (us row par spinner)
  const handlePick = async (col) => {
    setInlineError("");
    const res = await dispatch(
      bulkAddProducts({ collectionId: col._id, productIds }),
    );
    if (!bulkAddProducts.fulfilled.match(res)) {
      handleError(res.payload || "Could not add products — try again.");
      return;
    }
    const { added, skipped } = res.payload;
    dispatch(fetchCollections()); // item-count badges refresh
    notifySuccess(
      `✓ ${added} product${added === 1 ? "" : "s"} added to "${col.name}"`,
      skipped ? `${skipped} ${skipped === 1 ? "was" : "were"} already in` : "",
    );
    onDone?.();
    onClose?.();
  };

  // Inline mini-form — nayi collection create → turant products add
  const handleCreate = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      setInlineError("Collection name must be at least 2 characters.");
      return;
    }
    setCreating(true);
    setInlineError("");
    const fd = new FormData();
    fd.append("name", name);
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `collection-${Date.now()}`;
    fd.append("slug", slug);
    fd.append("type", "manual");
    fd.append("isActive", "true");

    const created = await dispatch(addCollection(fd));
    if (!addCollection.fulfilled.match(created)) {
      setCreating(false);
      handleError(created.payload || "Could not create collection.");
      return;
    }

    const col = created.payload;
    const res = await dispatch(
      bulkAddProducts({ collectionId: col._id, productIds }),
    );
    setCreating(false);
    if (!bulkAddProducts.fulfilled.match(res)) {
      handleError(
        res.payload || "Collection created but products could not be added.",
      );
      return;
    }
    const { added, skipped } = res.payload;
    notifySuccess(
      `"${col.name}" created`,
      `✓ ${added} product${added === 1 ? "" : "s"} added${
        skipped ? ` (${skipped} already in)` : ""
      }`,
    );
    setNewName("");
    setShowCreate(false);
    onDone?.();
    onClose?.();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${productIds.length} product${
        productIds.length === 1 ? "" : "s"
      } to collection`}
      subtitle="Select a collection — all selected products will be added immediately."
      icon={<GridIcon className="w-4 h-4" />}
    >
      {inlineError && (
        <div className="mb-3 rounded-(--radius) border border-red-300 bg-red-50 px-3 py-2.5 text-[12.5px] font-medium text-red-600">
          {inlineError}
        </div>
      )}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search collections…"
        className="form-input mb-3 w-full"
        aria-label="Search collections"
      />

      {collections.length === 0 ? (
        <div className="rounded-(--radius) border border-dashed border-(--border) bg-(--surface-sunken) px-4 py-8 text-center">
          <p className="font-semibold text-(--ink)">No collections yet</p>
          <p className="mt-1 text-[12px] text-(--ink-muted)">
            Create a new collection below to immediately add selected products.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.length === 0 && (
            <p className="px-1 py-4 text-center text-[12.5px] text-(--ink-muted)">
              No collections found matching &quot;{search}&quot;.
            </p>
          )}
          {filtered.map((col) => {
            const already = alreadyCount(col._id);
            const busy = bulkAddLoadingId === col._id;
            return (
              <button
                key={col._id}
                type="button"
                disabled={bulkAddLoadingId !== null}
                onClick={() => handlePick(col)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-(--radius) border border-(--border) bg-(--surface-sunken) px-3 py-2.5 text-left transition-colors hover:border-(--brand) disabled:opacity-60"
              >
                <Thumb
                  src={col.image}
                  alt={col.name}
                  className="w-10 h-10"
                  rounded="rounded-xl"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-(--ink)">
                    {col.name}
                  </span>
                  {already > 0 && (
                    <span className="block text-[11px] text-(--ink-muted)">
                      already contains {already} of the selected
                    </span>
                  )}
                </span>
                {busy ? (
                  <span className="spinner spinner-sm shrink-0" />
                ) : (
                  <span className="badge badge-neutral shrink-0">
                    {col.productCount ?? 0} items
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ＋ Create new collection — inline mini form */}
      <div className="mt-4 border-t border-(--border) pt-4">
        {showCreate ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New collection name…"
              className="form-input flex-1"
              autoFocus
              aria-label="New collection name"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || newName.trim().length < 2}
              className="btn btn-primary btn-sm shrink-0"
            >
              {creating ? <span className="spinner spinner-sm" /> : "Create & Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
              }}
              className="btn btn-ghost btn-sm shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn btn-ghost btn-sm w-full"
          >
            ＋ Create new collection
          </button>
        )}
      </div>
    </Drawer>
  );
};

export default BulkCollectionPicker;
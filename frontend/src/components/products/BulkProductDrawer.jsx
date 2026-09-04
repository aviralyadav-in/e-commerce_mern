import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addProduct,
  fetchProducts,
} from "../../features/products/productsSlice";
import { notifyError, notifySuccess } from "../../lib/toast";
import Drawer from "../common/Drawer";
import { Field } from "../common/Field";
import {
  CheckIcon,
  ChevronDownIcon,
  ImageIcon,
  PackageIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "../common/Icon";

const MAX_ROWS = 20;
const MAX_IMAGES = 5;

const emptyRow = (categoryId = "") => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  stock: "",
  categoryId,
  subCategory: "Men",
  collections: [], // 🆕 Collections section se chuni hui collections (ids)
  images: [], // { file, preview, id }
});

const validateRow = (row) => {
  const errs = {};
  if (row.name.trim().length < 2)
    errs.name = "Name must be at least 2 characters.";
  if (row.description.trim().length < 10)
    errs.description = "Description must be at least 10 characters.";
  if (!row.categoryId) errs.categoryId = "Select a category.";
  if (row.price === "" || Number.isNaN(Number(row.price)) || Number(row.price) < 0)
    errs.price = "Valid price is required.";
  if (row.stock === "" || Number.isNaN(Number(row.stock)) || Number(row.stock) < 0)
    errs.stock = "Valid stock is required.";
  if (row.discountPrice !== "" && Number(row.discountPrice) < 0)
    errs.discountPrice = "Cannot be negative.";
  if (
    row.discountPrice !== "" &&
    row.price !== "" &&
    Number(row.discountPrice) >= Number(row.price)
  )
    errs.discountPrice = "Must be less than the price.";
  if (row.images.length === 0) errs.images = "At least one image is required.";
  return errs;
};

/* ---------- One repeatable product row ---------- */
function BulkRow({
  row,
  index,
  categories,
  collections,
  errors,
  open,
  canRemove,
  onToggle,
  onChange,
  onRemove,
  onImages,
  onRemoveImage,
}) {
  const selectedCategory = categories.find((c) => c._id === row.categoryId);
  // Sirf Men / Women options (requirement)
  const availableSubCategories = selectedCategory?.subCategories?.length
    ? [...new Set(selectedCategory.subCategories)]
    : ["Men", "Women"];

  // 🆕 Collections section ke active collections — dynamic options
  const activeCollections = (collections || []).filter(
    (c) => c.isActive !== false,
  );

  const err = (f) => errors[f];
  const invalid = (f) => (errors[f] ? "is-invalid" : "");
  const slotsLeft = MAX_IMAGES - row.images.length;

  return (
    <div className="overflow-hidden rounded-xl border border-(--border) bg-white">
      {/* Row header — collapsed summary + expand/remove */}
      <div className="flex items-center gap-1 px-2.5 py-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
          onClick={onToggle}
          aria-expanded={open}
        >
          <ChevronDownIcon
            className={`w-4 h-4 shrink-0 text-(--ink-muted) transition-transform ${open ? "" : "-rotate-90"}`}
          />
          <span className="w-5 shrink-0 text-center text-xs font-bold text-(--ink-faint)">
            {index + 1}
          </span>
          <span className="truncate text-sm font-semibold text-(--ink)">
            {row.name.trim() || "New product"}
          </span>
          {row.images.length > 0 && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
              {row.images.length} img
            </span>
          )}
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-delete shrink-0"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? "Remove this row" : "At least one row is needed"}
          aria-label="Remove row"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-(--border) px-3 pb-4 pt-3">
          <div className="form-row">
            <Field label="Name" required error={err("name")}>
              <input
                className={`form-input ${invalid("name")}`}
                value={row.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Classic Mini Handbag"
              />
            </Field>
            <Field label="Price (₹)" required error={err("price")}>
              <input
                type="number"
                min="0"
                className={`form-input ${invalid("price")}`}
                value={row.price}
                onChange={(e) => onChange({ price: e.target.value })}
                placeholder="1499"
              />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Stock" required error={err("stock")}>
              <input
                type="number"
                min="0"
                className={`form-input ${invalid("stock")}`}
                value={row.stock}
                onChange={(e) => onChange({ stock: e.target.value })}
                placeholder="25"
              />
            </Field>
            <Field
              label="Discount price (₹)"
              optional
              error={err("discountPrice")}
            >
              <input
                type="number"
                min="0"
                className={`form-input ${invalid("discountPrice")}`}
                value={row.discountPrice}
                onChange={(e) => onChange({ discountPrice: e.target.value })}
                placeholder="1199"
              />
            </Field>
          </div>

          <Field label="Description" required error={err("description")}>
            <textarea
              rows={2}
              className={`form-input ${invalid("description")}`}
              value={row.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Compact quilted mini bag with gold-tone hardware…"
            />
          </Field>

          <div className="form-row mt-3">
            <Field label="Category" required error={err("categoryId")}>
              <select
                className={`form-select ${invalid("categoryId")}`}
                value={row.categoryId}
                onChange={(e) =>
                  onChange({ categoryId: e.target.value, subCategory: "Men" })
                }
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sub-category">
              <select
                className="form-select"
                value={row.subCategory}
                onChange={(e) => onChange({ subCategory: e.target.value })}
              >
                {availableSubCategories.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* 🆕 Collections — Collections section se dynamic options */}
          <Field
            label="Collections"
            optional
            hint="Collections section me bani collections hi yahan dikhti hain."
          >
            {activeCollections.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeCollections.map((col) => {
                  const checked = (row.collections || []).includes(col._id);
                  return (
                    <label
                      key={col._id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                        checked
                          ? "border-amber-500 bg-amber-50 font-semibold text-amber-700"
                          : "border-(--border) bg-white text-(--ink-muted) hover:border-amber-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange({
                            collections: checked
                              ? row.collections.filter((id) => id !== col._id)
                              : [...row.collections, col._id],
                          })
                        }
                        className="h-3.5 w-3.5 accent-amber-500"
                      />
                      {col.name}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-(--radius) border border-dashed border-(--border) bg-(--surface-sunken) px-3 py-2 text-xs text-(--ink-muted)">
                No collections yet — Collections section me banayein.
              </p>
            )}
          </Field>

          <div className="mt-3">
            <Field
              label="Images"
              required
              error={err("images")}
              hint={
                err("images")
                  ? undefined
                  : "First image becomes the cover everywhere."
              }
            >
              {row.images.length > 0 && (
                <div className="thumb-grid mb-2">
                  {row.images.map((img, i) => (
                    <div key={img.id} className="thumb">
                      <img src={img.preview} alt="Upload preview" />
                      <button
                        type="button"
                        className="thumb-remove"
                        onClick={() => onRemoveImage(img.id)}
                        aria-label="Remove image"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="thumb-primary-tag">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {slotsLeft > 0 ? (
                <div className={`dropzone ${invalid("images")}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      onImages(e.target.files);
                      e.target.value = "";
                    }}
                    aria-label={`Images for product ${index + 1}`}
                  />
                  <ImageIcon className="w-5 h-5 text-(--ink-faint)" />
                  <p className="text-[12px] font-medium text-(--ink-soft)">
                    Click to upload images
                  </p>
                  <p className="text-[11px] text-(--ink-faint)">
                    PNG, JPG or WEBP — {slotsLeft} slot
                    {slotsLeft === 1 ? "" : "s"} left
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-(--radius) border border-(--border) bg-(--surface-sunken) px-3 py-2.5">
                  <CheckIcon className="w-4 h-4 text-(--success)" />
                  <p className="text-[12px] text-(--ink-muted)">
                    All {MAX_IMAGES} slots filled.
                  </p>
                </div>
              )}
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main drawer ---------- */
function BulkProductDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((s) => s.categories);
  // 🆕 Collections options ab naye Collections section se
  const { collections } = useSelector((s) => s.collections);

  const [rows, setRows] = useState(() => [emptyRow(categories[0]?._id || "")]);
  const [errors, setErrors] = useState({});
  const [openKey, setOpenKey] = useState(() => rows[0]?.key ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null); // [{ name, ok, error }]

  const updateRow = (key, patch) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    const r = emptyRow(categories[0]?._id || "");
    setRows((rs) => [...rs, r]);
    setOpenKey(r.key);
  };

  const removeRow = (key) => {
    setRows((rs) => rs.filter((r) => r.key !== key));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const handleImages = (key, files) => {
    const list = Array.from(files || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!list.length) return;
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const slots = MAX_IMAGES - r.images.length;
        const added = list.slice(0, Math.max(0, slots)).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        }));
        return { ...r, images: [...r.images, ...added] };
      }),
    );
  };

  const removeImage = (key, id) => {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const target = r.images.find((i) => i.id === id);
        if (target) URL.revokeObjectURL(target.preview);
        return { ...r, images: r.images.filter((i) => i.id !== id) };
      }),
    );
  };

  // Ek-ek karke products create karo (sequential — progress dikhate hue)
  const handleSubmit = async () => {
    const nextErrors = {};
    rows.forEach((r) => {
      const e = validateRow(r);
      if (Object.keys(e).length) nextErrors[r.key] = e;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setOpenKey(Object.keys(nextErrors)[0]);
      notifyError("Fix the highlighted rows first");
      return;
    }

    setSubmitting(true);
    setProgress({ current: 0, total: rows.length });
    const outcomes = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProgress({ current: i + 1, total: rows.length });

      const fd = new FormData();
      const baseSlug = row.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      fd.append("name", row.name.trim());
      fd.append("description", row.description.trim());
      // Bulk me slug/SKI collision na ho — chhota random suffix
      fd.append("slug", `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`);
      fd.append("price", Number(row.price));
      fd.append("stock", Number(row.stock));
      if (row.discountPrice !== "")
        fd.append("discountPrice", Number(row.discountPrice));
      fd.append("categoryId", row.categoryId);
      fd.append("subCategory", row.subCategory);
      fd.append("isActive", true);
      // 🆕 Collections — Collections section se chuni hui ids (JSON array)
      fd.append("collections", JSON.stringify(row.collections || []));
      fd.append(
        "sku",
        `SKU-${Date.now().toString(36).toUpperCase()}-${i}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
      );
      row.images.forEach((img) => fd.append("desktopImages", img.file));

      const res = await dispatch(addProduct(fd));
      if (addProduct.fulfilled.match(res)) {
        outcomes.push({ name: row.name.trim(), ok: true });
      } else {
        outcomes.push({
          name: row.name.trim(),
          ok: false,
          error: res.payload || "Could not create product",
        });
      }
    }

    setResults(outcomes);
    setSubmitting(false);
    const ok = outcomes.filter((o) => o.ok).length;
    const summary = `${ok} of ${rows.length} products created.`;
    if (ok === rows.length) {
      notifySuccess("Bulk add finished", summary);
    } else {
      notifyError("Bulk add finished", summary);
    }
    if (ok > 0) dispatch(fetchProducts({ limit: 100 }));
  };

  const okCount = results ? results.filter((r) => r.ok).length : 0;
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-2xl"
      closeOnBackdrop={!submitting}
      icon={<PackageIcon className="w-4 h-4" />}
      title="Bulk add products"
      subtitle={`Create up to ${MAX_ROWS} products in one session — each row is a full product.`}
      footer={
        results ? (
          <div className="flex w-full items-center justify-end gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                const first = emptyRow(categories[0]?._id || "");
                setRows([first]);
                setOpenKey(first.key);
                setResults(null);
                setErrors({});
              }}
            >
              Add more
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-3">
            <button
              className="btn btn-ghost"
              onClick={addRow}
              disabled={submitting || rows.length >= MAX_ROWS}
            >
              <PlusIcon className="w-4 h-4" /> Add row
            </button>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting || rows.length === 0}
              >
                {submitting
                  ? `Adding ${progress.current}/${progress.total}…`
                  : `Create ${rows.length} product${rows.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )
      }
    >
      {results ? (
        <div>
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              okCount === results.length
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <b>{okCount}</b> of <b>{results.length}</b> products created
            successfully.
          </div>
          <ul className="flex flex-col gap-2">
            {results.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-lg border border-(--border) bg-white px-3 py-2.5 text-sm"
              >
                {r.ok ? (
                  <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <XIcon className="mt-0.5 w-4 h-4 shrink-0 text-red-500" />
                )}
                <span className="min-w-0">
                  <span className="font-semibold text-(--ink)">{r.name}</span>
                  {!r.ok && (
                    <span className="block text-xs text-red-600">{r.error}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submitting && (
            <div className="mb-1 rounded-lg bg-(--brand-soft) px-3 py-2 text-[12.5px] font-medium text-(--brand)">
              Creating products… {progress.current} of {progress.total} done.
              Please don't close this panel.
            </div>
          )}
          {rows.map((row, i) => (
            <BulkRow
              key={row.key}
              row={row}
              index={i}
              categories={categories}
              collections={collections}
              errors={errors[row.key] || {}}
              open={openKey === row.key}
              canRemove={rows.length > 1 && !submitting}
              onToggle={() => setOpenKey(openKey === row.key ? null : row.key)}
              onChange={(patch) => updateRow(row.key, patch)}
              onRemove={() => removeRow(row.key)}
              onImages={(files) => handleImages(row.key, files)}
              onRemoveImage={(id) => removeImage(row.key, id)}
            />
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm self-start"
            onClick={addRow}
            disabled={submitting || rows.length >= MAX_ROWS}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add another product
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default BulkProductDrawer;
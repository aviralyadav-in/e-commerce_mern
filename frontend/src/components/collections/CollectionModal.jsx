import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCollection,
  clearCollectionError,
  updateCollection,
} from "../../features/collections/collectionsSlice";
import useFormSync from "../../hooks/useFormSync";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import Thumb from "../common/Thumb";
import {
  CheckIcon,
  GridIcon,
  ImageIcon,
} from "../common/Icon";

const CollectionModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.collections);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  // Marketing curation features
  const [showOnHomePage, setShowOnHomePage] = useState(false);
  const [showAsBadge, setShowAsBadge] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useFormSync(`${isOpen}|${editData?._id ?? ""}`, () => {
    if (editData) {
      setName(editData.name || "");
      setDescription(editData.description || "");
      setImage(null);
      setShowOnHomePage(editData.showOnHomePage === true);
      setShowAsBadge(editData.showAsBadge === true);
      setIsActive(editData.isActive !== false);
    } else {
      setName("");
      setDescription("");
      setImage(null);
      setShowOnHomePage(false);
      setShowAsBadge(false);
      setIsActive(true);
    }
    setErrors({});
    setTouched({});
  });

  useEffect(() => {
    if (isOpen) dispatch(clearCollectionError());
  }, [dispatch, isOpen]);

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const d = "description" in fields ? fields.description : description;
    const img = "image" in fields ? fields.image : image;

    if (!n.trim()) errs.name = "Collection name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";
    else if (d.trim().length < 5)
      errs.description = "Description must be at least 5 characters.";

    if (!editData && !img) errs.image = "Please select a collection image.";

    return errs;
  };

  const revalidate = (field, value) => {
    if (!touched[field]) return;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value =
      field === "name"
        ? name
        : field === "description"
          ? description
          : image;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, description: true, image: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug);
    formData.append("description", description.trim());
    formData.append("showOnHomePage", showOnHomePage);
    formData.append("showAsBadge", showAsBadge);
    formData.append("isActive", isActive);
    if (image) formData.append("image", image);

    const action = editData
      ? updateCollection({ id: editData._id, data: formData })
      : addCollection(formData);

    dispatch(action).then((res) => {
      if (!res.error) onClose();
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<GridIcon className="w-4 h-4" />}
      title={editData ? "Edit collection" : "New collection"}
      subtitle={
        editData
          ? "Update collection settings, homepage placement, or promotional badges."
          : "Curate a group of products for seasonal promotions, homepage features, and marketing campaigns."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="collection-form"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner spinner-on-brand" />}
            {loading
              ? "Saving…"
              : editData
                ? "Save changes"
                : "Create collection"}
          </button>
        </>
      }
    >
      <FormAlert>{error}</FormAlert>

      <form
        id="collection-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        {/* Collection Name */}
        <Field
          label="Collection name"
          required
          htmlFor="col-name"
          error={touched.name ? errors.name : undefined}
          hint={
            name.trim()
              ? `Slug: /${slug}`
              : "Used for promotional banners, storefront filters, and product badges."
          }
        >
          <input
            id="col-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              revalidate("name", e.target.value);
            }}
            onBlur={() => handleBlur("name")}
            placeholder="e.g. Summer Flash Sale, New Arrivals, Best Sellers"
            className={`form-input ${touched.name && errors.name ? "is-invalid" : ""}`}
          />
        </Field>

        {/* Description */}
        <Field
          label="Description"
          required
          htmlFor="col-desc"
          error={touched.description ? errors.description : undefined}
          hint={
            description.trim()
              ? `${description.length} / 500 characters`
              : "A brief tagline displayed alongside this collection on the storefront."
          }
        >
          <textarea
            id="col-desc"
            rows={2}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              revalidate("description", e.target.value);
            }}
            onBlur={() => handleBlur("description")}
            placeholder="e.g. Light, functional and stylish picks for weekend escapes…"
            className={`form-textarea ${touched.description && errors.description ? "is-invalid" : ""}`}
          />
        </Field>

        {/* ══════════════════════════════════════════════════════════
            ✨ MARKETING FEATURE CARDS (Visual & Self-Explanatory)
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-2.5 pt-1">
          <label className="block text-[12.5px] font-bold text-(--ink)">
            Marketing & Visibility Features
          </label>

          {/* Feature 1: Home Page Showcase */}
          <div
            onClick={() => setShowOnHomePage(!showOnHomePage)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              showOnHomePage
                ? "border-amber-500/80 bg-amber-50/25 dark:bg-amber-950/25 ring-2 ring-amber-500/20"
                : "border-(--border) bg-(--surface-card) hover:bg-(--surface-sunken)"
            }`}
          >
            <input
              type="checkbox"
              checked={showOnHomePage}
              onChange={() => {}} // handled by parent onClick
              className="mt-1 h-4 w-4 rounded accent-amber-500 cursor-pointer pointer-events-none"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-semibold text-[13px] text-(--ink)">
                  Feature on Storefront Home Page
                </span>
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Featured Pieces
                </span>
              </div>
              <p className="text-[11.5px] text-(--ink-muted) leading-snug">
                Products in this collection will appear prominently in the &ldquo;Featured Pieces&rdquo; section on the home page.
              </p>
            </div>
          </div>

          {/* Feature 2: Product Badge Overlay */}
          <div
            onClick={() => setShowAsBadge(!showAsBadge)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              showAsBadge
                ? "border-indigo-500/80 bg-indigo-50/25 dark:bg-indigo-950/25 ring-2 ring-indigo-500/20"
                : "border-(--border) bg-(--surface-card) hover:bg-(--surface-sunken)"
            }`}
          >
            <input
              type="checkbox"
              checked={showAsBadge}
              onChange={() => {}} // handled by parent onClick
              className="mt-1 h-4 w-4 rounded accent-indigo-500 cursor-pointer pointer-events-none"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-semibold text-[13px] text-(--ink)">
                  Show Promotional Badge on Product Cards
                </span>
                <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  Product Overlay
                </span>
              </div>
              <p className="text-[11.5px] text-(--ink-muted) leading-snug">
                Displays the collection name as a branded badge on all member product cards across the shop.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ✨ LIVE STOREFRONT PREVIEW CARD
            ══════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-(--border) bg-(--surface-sunken)/40 p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-(--ink-faint)">
              Storefront Preview
            </span>
            <div className="flex items-center gap-1.5">
              {showOnHomePage && (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Home
                </span>
              )}
              {showAsBadge && (
                <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  Badge
                </span>
              )}
              {!showOnHomePage && !showAsBadge && (
                <span className="text-[10.5px] text-(--ink-faint)">Standard Collection</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-(--ink) truncate">
                {name.trim() || "New Collection"}
              </p>
              <p className="text-[11.5px] text-(--ink-muted) line-clamp-1">
                {description.trim() || "Collection description will appear here…"}
              </p>
            </div>
            {showAsBadge && (
              <div className="shrink-0 px-2 py-1 rounded bg-(--brand) text-white font-bold text-[10.5px] shadow-xs uppercase tracking-wide">
                {name.trim() || "BADGE"}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-(--ink-faint) pt-1 border-t border-(--border)/60 flex items-center gap-1.5">
            <span>Storefront URL:</span>
            <span className="bg-(--surface-card) px-1.5 py-0.5 rounded text-(--ink-soft) border border-(--border)/60">
              /collections/{slug || "collection-slug"}
            </span>
          </div>
        </div>

        {/* Collection Status */}
        <Field
          label="Visibility Status"
          optional
          hint="Active collections appear on the storefront. Hidden collections are saved as drafts."
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`choice-pill ${isActive ? "choice-pill-active" : ""}`}
            >
              {isActive && <CheckIcon className="w-3.5 h-3.5" />}
              Active (Visible)
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`choice-pill ${!isActive ? "choice-pill-active" : ""}`}
            >
              {!isActive && <CheckIcon className="w-3.5 h-3.5" />}
              Hidden (Draft)
            </button>
          </div>
        </Field>

        {/* Collection Image Dropzone */}
        <Field
          label="Collection image"
          required={!editData}
          optional={!!editData}
          error={touched.image ? errors.image : undefined}
        >
          {editData?.image && !image && (
            <div className="flex items-center gap-2.5 mb-2">
              <Thumb
                src={editData.image}
                alt={editData.name}
                className="w-14 h-14"
              />
              <p className="text-[11.5px] text-(--ink-muted)">
                Current image — upload a new image below to replace it.
              </p>
            </div>
          )}
          <div
            className={`dropzone ${
              touched.image && errors.image ? "is-invalid" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setImage(file);
                revalidate("image", file);
              }}
              onBlur={() => handleBlur("image")}
              aria-label="Collection image"
            />
            {image ? (
              <>
                <CheckIcon className="w-5 h-5 text-(--brand)" />
                <p className="text-[12.5px] font-semibold text-(--ink) truncate max-w-full">
                  {image.name}
                </p>
                <p className="text-[11px] text-(--ink-faint)">
                  Click to choose a different file
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-(--ink-faint)" />
                <p className="text-[12.5px] font-medium text-(--ink-soft)">
                  Click to upload an image
                </p>
                <p className="text-[11px] text-(--ink-faint)">
                  PNG, JPG or WEBP up to 5&nbsp;MB
                </p>
              </>
            )}
          </div>
        </Field>
      </form>
    </Drawer>
  );
};

export default CollectionModal;

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addBanner, updateBanner } from "../../features/banners/bannersSlice";
import useFormSync from "../../hooks/useFormSync";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import Thumb from "../common/Thumb";
import { getAssetUrl } from "../../utils/assetUrl";
import { CheckIcon, ImageIcon, LayersIcon } from "../common/Icon";

const QUICK_LINK_PRESETS = [
  { label: "All Products", url: "/products" },
  { label: "New Arrivals", url: "/products?collections=new-arrivals" },
  { label: "Sale & Offers", url: "/products?discount=true" },
  { label: "Collections", url: "/collections" },
  { label: "Homepage", url: "/" },
];

const BannerModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.banners);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [page, setPage] = useState("home");
  const [position, setPosition] = useState("after-hero");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Re-seed form state whenever the drawer opens for a different record.
  useFormSync(`${isOpen}|${editData?._id ?? ""}`, () => {
    if (editData) {
      setTitle(editData.title || "");
      setSubtitle(editData.subtitle || "");
      setLinkUrl(editData.linkUrl || "");
      setSortOrder(editData.sortOrder || 0);
      setIsActive(editData.isActive !== false);
      setPage(editData.page || "home");
      setPosition(editData.position || "after-hero");
      setImage(null);
    } else {
      setTitle("");
      setSubtitle("");
      setLinkUrl("");
      setSortOrder(0);
      setIsActive(true);
      setPage("home");
      setPosition("after-hero");
      setImage(null);
    }
    setErrors({});
    setTouched({});
  });

  // Manage object URL for draft image preview
  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const validate = (fields = {}) => {
    const errs = {};
    const t = "title" in fields ? fields.title : title;
    const sub = "subtitle" in fields ? fields.subtitle : subtitle;
    const img = "image" in fields ? fields.image : image;
    const so = "sortOrder" in fields ? fields.sortOrder : sortOrder;

    if (!t.trim()) errs.title = "Banner title is required.";
    else if (t.trim().length < 2)
      errs.title = "Title must be at least 2 characters.";
    else if (t.trim().length > 100)
      errs.title = "Title cannot exceed 100 characters.";

    if (sub && sub.trim().length > 200)
      errs.subtitle = "Subtitle cannot exceed 200 characters.";

    if (!editData && !img) errs.image = "Please select a banner image.";

    if (so < 0 || isNaN(Number(so))) errs.sortOrder = "Sort order cannot be negative.";

    return errs;
  };

  /** Live-correct a field only once the user has already left it. */
  const revalidate = (field, value) => {
    if (!touched[field]) return;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const err = (field) => (touched[field] ? errors[field] : undefined);
  const invalid = (field) =>
    touched[field] && errors[field] ? "is-invalid" : "";

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ title: true, image: true, sortOrder: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subtitle", subtitle);
    formData.append("linkUrl", linkUrl);
    formData.append("sortOrder", sortOrder);
    formData.append("isActive", isActive);
    formData.append("page", page);
    formData.append("position", position);
    if (image) formData.append("image", image);

    const action = editData
      ? updateBanner({ id: editData._id, data: formData })
      : addBanner(formData);

    dispatch(action).then((res) => {
      if (!res.error) onClose();
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<ImageIcon className="w-4 h-4" />}
      title={editData ? "Edit banner" : "New banner"}
      subtitle={
        editData
          ? "Update this promo banner on your storefront."
          : "Add a high-impact promo banner to feature collections or sales."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="banner-form"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner spinner-on-brand" />}
            {loading ? "Saving…" : editData ? "Save changes" : "Create banner"}
          </button>
        </>
      }
    >
      <FormAlert>{error}</FormAlert>

      <form
        id="banner-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Field
          label="Banner title"
          required
          htmlFor="banner-title"
          error={err("title")}
          hint={
            err("title")
              ? undefined
              : title.trim()
                ? `${title.length} / 100 characters`
                : "Prominent headline displayed on the banner."
          }
        >
          <input
            id="banner-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              revalidate("title", e.target.value);
            }}
            onBlur={() => handleBlur("title", title)}
            placeholder="e.g. Monsoon Sale 2026"
            className={`form-input ${invalid("title")}`}
          />
        </Field>

        <Field
          label="Subtitle"
          optional
          htmlFor="banner-subtitle"
          error={err("subtitle")}
          hint={
            err("subtitle")
              ? undefined
              : subtitle.trim()
                ? `${subtitle.length} / 200 characters`
                : "Short supporting tagline shown below the title."
          }
        >
          <input
            id="banner-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              revalidate("subtitle", e.target.value);
            }}
            onBlur={() => handleBlur("subtitle", subtitle)}
            placeholder="e.g. Up to 50% off on all travel backpacks"
            className={`form-input ${invalid("subtitle")}`}
          />
        </Field>

        <Field
          label="Destination link"
          optional
          htmlFor="banner-link"
          hint="Where shoppers are redirected when clicking this banner."
        >
          <input
            id="banner-link"
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="e.g. /products or /collections"
            className="form-input mb-1.5"
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-medium text-(--ink-faint)">
              Quick presets:
            </span>
            {QUICK_LINK_PRESETS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => setLinkUrl(preset.url)}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  linkUrl === preset.url
                    ? "border-(--brand) bg-(--brand-soft) text-(--brand)"
                    : "border-(--border) bg-(--surface-card) text-(--ink-soft) hover:border-(--brand)"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </Field>

        {/* 🆕 Storefront Placement Preview Card */}
        <div className="rounded-xl border border-(--border) bg-(--surface-sunken)/40 p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-(--brand-soft) text-(--brand)">
              <LayersIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-(--ink)">
              Storefront Placement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="banner-page"
                className="mb-1 block text-[11.5px] font-semibold text-(--ink-soft)"
              >
                Target Page
              </label>
              <select
                id="banner-page"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="form-select text-xs"
              >
                <option value="home">Home Page</option>
                <option value="shop">Shop / Catalog Page</option>
                <option value="wishlist">Wishlist Page</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="banner-position"
                className="mb-1 block text-[11.5px] font-semibold text-(--ink-soft)"
              >
                Slot Position
              </label>
              <select
                id="banner-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="form-select text-xs"
              >
                <option value="after-hero">After hero (Top section)</option>
                <option value="after-products">After products (Bottom section)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--surface-card) px-3 py-2 text-xs text-(--ink-soft) flex-wrap">
            <span className="font-semibold text-(--brand)">Will appear on:</span>
            <span className="font-bold text-(--ink)">
              {page === "home" ? "Home Page" : page === "shop" ? "Shop Page" : "Wishlist Page"}
            </span>
            <span className="text-(--ink-faint)">›</span>
            <span className="text-(--ink-muted)">
              {position === "after-hero" ? "Prominently after the top hero banner" : "Below the product catalog grid"}
            </span>
          </div>
        </div>

        <div className="form-row">
          <Field
            label="Sort order"
            htmlFor="banner-sort"
            error={err("sortOrder")}
            hint={err("sortOrder") ? undefined : "Lower numbers display first (e.g. 0, 1, 2)."}
          >
            <input
              id="banner-sort"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSortOrder(next);
                revalidate("sortOrder", next);
              }}
              onBlur={() => handleBlur("sortOrder", sortOrder)}
              className={`form-input ${invalid("sortOrder")}`}
            />
          </Field>

          <Field label="Status" htmlFor="banner-status">
            <select
              id="banner-status"
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
              className="form-select"
            >
              <option value="active">Active (Visible)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </Field>
        </div>

        <Field
          label="Banner image"
          required={!editData}
          optional={!!editData}
          error={err("image")}
          hint="Upload a wide, crisp banner graphic for desktop & mobile."
        >
          {editData?.image && !image && (
            <div className="mb-2.5 rounded-xl border border-(--border) bg-(--surface-card) p-2.5">
              <Thumb
                src={editData.image}
                alt={editData.title}
                className="w-full h-32 mb-1.5"
                rounded="rounded-lg"
              />
              <p className="text-[11.5px] text-(--ink-muted) flex items-center justify-between">
                <span className="font-semibold text-(--ink)">Current live image</span>
                <span className="text-(--ink-faint)">Upload below to replace</span>
              </p>
            </div>
          )}

          <div className={`dropzone ${invalid("image")}`}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setImage(file);
                revalidate("image", file);
              }}
              onBlur={() => handleBlur("image", image)}
              aria-label="Banner image"
            />
            {previewUrl ? (
              <div className="flex flex-col items-center gap-2 w-full p-1">
                <div className="relative w-full max-h-36 overflow-hidden rounded-lg border border-(--border)">
                  <img
                    src={previewUrl}
                    alt="Banner draft preview"
                    className="w-full max-h-32 object-cover"
                  />
                  <span className="absolute top-2 right-2 rounded-full bg-emerald-500/90 text-white px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <CheckIcon className="w-3 h-3" /> Ready
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-(--ink) truncate max-w-xs">
                    {image.name}
                  </p>
                  <p className="text-[11px] text-(--brand) font-medium mt-0.5">
                    Click or drop another file to replace
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-(--ink-faint)" />
                <p className="text-[12.5px] font-medium text-(--ink-soft)">
                  Click or drag banner image here
                </p>
                <p className="text-[11px] text-(--ink-faint)">
                  Wide landscape banner recommended — PNG, JPG or WEBP up to 5&nbsp;MB
                </p>
              </>
            )}
          </div>
        </Field>
      </form>
    </Drawer>
  );
};

export default BannerModal;

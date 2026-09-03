import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addBanner, updateBanner } from "../../features/banners/bannersSlice";
import useFormSync from "../../hooks/useFormSync";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import Thumb from "../common/Thumb";
import { CheckIcon, ImageIcon } from "../common/Icon";

const BannerModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.banners);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  // 🆕 Multi-page promo — kis page par, kahan dikhe
  const [page, setPage] = useState("home");
  const [position, setPosition] = useState("after-hero");
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Re-seed form state whenever the drawer opens for a different record.
  // (Render-phase sync via useFormSync — replaces the old setState-in-effect.)
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

  const validate = (fields = {}) => {
    const errs = {};
    const t = "title" in fields ? fields.title : title;
    const img = "image" in fields ? fields.image : image;
    const so = "sortOrder" in fields ? fields.sortOrder : sortOrder;

    if (!t.trim()) errs.title = "Banner title is required.";
    else if (t.trim().length < 2)
      errs.title = "Title must be at least 2 characters.";

    if (!editData && !img) errs.image = "Please select a banner image.";

    if (so < 0) errs.sortOrder = "Sort order cannot be negative.";

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
          ? "Update this promo slot on the storefront home page."
          : "Add a hero image to promote a collection or sale."
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

        <Field label="Subtitle" optional htmlFor="banner-subtitle">
          <input
            id="banner-subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Up to 50% off every backpack"
            className="form-input"
          />
        </Field>

        <Field
          label="Link URL"
          optional
          htmlFor="banner-link"
          hint="Where the banner sends shoppers when clicked."
        >
          <input
            id="banner-link"
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/products?category=backpacks"
            className="form-input"
          />
        </Field>

        {/* 🆕 Multi-page promo slot — live niyabags jaisa */}
        <div className="form-row">
          <Field
            label="Show on page"
            htmlFor="banner-page"
            hint="Kis storefront page par ye banner dikhe."
          >
            <select
              id="banner-page"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="form-select"
            >
              <option value="home">Home</option>
              <option value="shop">Shop</option>
              <option value="wishlist">Wishlist</option>
            </select>
          </Field>

          <Field
            label="Position"
            htmlFor="banner-position"
            hint="Page par kahan dikhe."
          >
            <select
              id="banner-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="form-select"
            >
              <option value="after-hero">After hero (page top)</option>
              <option value="after-products">After products grid</option>
            </select>
          </Field>
        </div>

        <div className="form-row">
          <Field
            label="Sort order"
            htmlFor="banner-sort"
            error={err("sortOrder")}
            hint={err("sortOrder") ? undefined : "Lower numbers show first."}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>

        <Field
          label="Banner image"
          required={!editData}
          optional={!!editData}
          error={err("image")}
        >
          {editData?.image && !image && (
            <div className="flex items-center gap-2.5 mb-2">
              <Thumb
                src={editData.image}
                alt={editData.title}
                className="w-24 h-12"
              />
              <p className="text-[11.5px] text-(--ink-muted)">
                Current image — upload a new one to replace it.
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
                  Wide landscape works best — PNG, JPG or WEBP up to 5&nbsp;MB
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

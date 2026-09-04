import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCategory,
  clearCategoryError,
  updateCategory,
} from "../../features/categories/categoriesSlice";
import useFormSync from "../../hooks/useFormSync";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import Thumb from "../common/Thumb";
import { CheckIcon, GridIcon, ImageIcon } from "../common/Icon";

const SUB_OPTIONS = ["Men", "Women"];

const CategoryModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(
    (state) => state.categories,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [subCategories, setSubCategories] = useState(["Men", "Women"]);
  // 🆕 Hierarchy — parent category (jaise Bags under Men)
  const [parentId, setParentId] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Re-seed form state whenever the drawer opens for a different record.
  // (Render-phase sync via useFormSync — replaces the old setState-in-effect.)
  useFormSync(`${isOpen}|${editData?._id ?? ""}`, () => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description);
      setImage(null);
      setSubCategories(
        editData.subCategories?.length
          ? editData.subCategories
          : ["Men", "Women"],
      );
      setParentId(
        editData.parentId
          ? String(editData.parentId?._id || editData.parentId)
          : "",
      );
    } else {
      setName("");
      setDescription("");
      setImage(null);
      setSubCategories(["Men", "Women"]);
      setParentId("");
    }
    setErrors({});
    setTouched({});
  });

  // Redux error clear karna external-system update hai — effect allowed hai
  useEffect(() => {
    if (isOpen) dispatch(clearCategoryError());
  }, [dispatch, isOpen]);

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const d = "description" in fields ? fields.description : description;
    const img = "image" in fields ? fields.image : image;
    const subs =
      "subCategories" in fields ? fields.subCategories : subCategories;

    if (!n.trim()) errs.name = "Category name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";
    else if (d.trim().length < 5)
      errs.description = "Description must be at least 5 characters.";

    if (!subs.length)
      errs.subCategories = "Select at least one sub-category (Men or Women).";

    if (!editData && !img) errs.image = "Please select a category image.";

    return errs;
  };

  /** Re-run one field's rule as the user types, but only after they've left it once. */
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
          : field === "subCategories"
            ? subCategories
            : image;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const toggleSubCategory = (value) => {
    setSubCategories((prev) => {
      const next = prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value];
      if (touched.subCategories) {
        const errs = validate({ subCategories: next });
        setErrors((prevErrs) => ({
          ...prevErrs,
          subCategories: errs.subCategories,
        }));
      }
      return next;
    });
  };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  /**
   * Parent-category dropdown options, computed like real admin panels:
   * - Child categories show their full path (e.g. "Bags › Laptop Bags").
   * - In edit mode, the category itself and all of its descendants are
   *   excluded so it can never be nested inside its own subtree (cycle).
   */
  const parentOptions = (() => {
    const excluded = new Set();
    if (editData) {
      excluded.add(String(editData._id));
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of categories) {
          const pid = c.parentId
            ? String(c.parentId._id || c.parentId)
            : null;
          if (pid && excluded.has(pid) && !excluded.has(String(c._id))) {
            excluded.add(String(c._id));
            grew = true;
          }
        }
      }
    }

    const namesById = new Map(
      categories.map((c) => [String(c._id), c.name]),
    );

    return categories
      .filter((c) => !excluded.has(String(c._id)))
      .map((c) => {
        const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
        const parentName = pid ? namesById.get(pid) : null;
        return {
          id: String(c._id),
          label: parentName ? `${parentName} › ${c.name}` : c.name,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      description: true,
      image: true,
      subCategories: true,
    });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("subCategories", JSON.stringify(subCategories));
    formData.append("parentId", parentId);
    if (image) formData.append("image", image);

    const action = editData
      ? updateCategory({ id: editData._id, data: formData })
      : addCategory(formData);

    dispatch(action).then((res) => {
      if (!res.error) onClose();
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<GridIcon className="w-4 h-4" />}
      title={editData ? "Edit category" : "New category"}
      subtitle={
        editData
          ? "Update how this collection appears on the storefront."
          : "Group products into a collection shoppers can browse."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="category-form"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner spinner-on-brand" />}
            {loading
              ? "Saving…"
              : editData
                ? "Save changes"
                : "Create category"}
          </button>
        </>
      }
    >
      <FormAlert>{error}</FormAlert>

      <form
        id="category-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Field
          label="Category name"
          required
          htmlFor="cat-name"
          error={touched.name ? errors.name : undefined}
          hint={name.trim() ? `Slug: /${slug}` : "Used in the storefront menu."}
        >
          <input
            id="cat-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              revalidate("name", e.target.value);
            }}
            onBlur={() => handleBlur("name")}
            placeholder="e.g. Laptop Backpacks"
            className={`form-input ${
              touched.name && errors.name ? "is-invalid" : ""
            }`}
          />
        </Field>

        <Field
          label="Description"
          required
          htmlFor="cat-desc"
          error={touched.description ? errors.description : undefined}
          hint={
            description.trim()
              ? `${description.length} / 500 characters`
              : "Shown on the category page to help shoppers understand the collection."
          }
        >
          <textarea
            id="cat-desc"
            rows="3"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              revalidate("description", e.target.value);
            }}
            onBlur={() => handleBlur("description")}
            placeholder="A short line shoppers see on the collection page…"
            className={`form-textarea ${
              touched.description && errors.description ? "is-invalid" : ""
            }`}
          />
        </Field>

        <Field
          label="Sub-categories"
          required
          hint="Which audiences this collection covers."
          error={touched.subCategories ? errors.subCategories : undefined}
        >
          <div className="flex gap-2">
            {SUB_OPTIONS.map((option) => {
              const selected = subCategories.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSubCategory(option)}
                  onBlur={() => handleBlur("subCategories")}
                  className={`choice-pill ${
                    selected ? "choice-pill-active" : ""
                  }`}
                >
                  {selected && <CheckIcon className="w-3.5 h-3.5" />}
                  {option}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 🆕 Hierarchy — parent category (structure ke liye) */}
        <Field
          label="Parent category"
          optional
          hint="Assign a parent category to create a hierarchy — for example, Laptop Bags under Bags. Leave as None for a top-level category."
        >
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="form-select"
          >
            <option value="">None — top-level category</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Category image"
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
                Current image — upload a new one to replace it.
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
              aria-label="Category image"
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

export default CategoryModal;

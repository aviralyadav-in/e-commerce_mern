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
  PlusIcon,
  XIcon,
} from "../common/Icon";

const FIELD_OPTIONS = [
  { value: "price", label: "Price (₹)" },
  { value: "stock", label: "Stock" },
  { value: "createdAt", label: "Created date" },
  { value: "subCategory", label: "Department" },
];

const OPERATOR_OPTIONS = {
  price: [
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less or equal" },
    { value: "eq", label: "equals" },
  ],
  stock: [
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less or equal" },
    { value: "eq", label: "equals" },
  ],
  createdAt: [{ value: "withinDays", label: "within last (days)" }],
  subCategory: [{ value: "eq", label: "is" }],
};

const VALUE_PLACEHOLDERS = {
  price: "e.g. 5000",
  stock: "e.g. 10",
  createdAt: "e.g. 30",
  subCategory: "",
};

const emptyRule = () => ({ field: "price", operator: "gt", value: "" });

const CollectionModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.collections);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  // 🆕 Manual = products khud link karo, Automated = rules se auto-membership
  const [type, setType] = useState("manual");
  const [rules, setRules] = useState([]);
  // 🆕 Home page curation + dynamic shop badge
  const [showOnHomePage, setShowOnHomePage] = useState(false);
  const [showAsBadge, setShowAsBadge] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useFormSync(`${isOpen}|${editData?._id ?? ""}`, () => {
    if (editData) {
      setName(editData.name || "");
      setDescription(editData.description || "");
      setImage(null);
      setType(editData.type === "automated" ? "automated" : "manual");
      setRules(
        (editData.rules || []).map((r) => ({
          field: r.field || "price",
          operator: r.operator || "gt",
          value: r.value ?? "",
        })),
      );
      setShowOnHomePage(editData.showOnHomePage === true);
      setShowAsBadge(editData.showAsBadge === true);
    } else {
      setName("");
      setDescription("");
      setImage(null);
      setType("manual");
      setRules([]);
      setShowOnHomePage(false);
      setShowAsBadge(false);
    }
    setErrors({});
    setTouched({});
  });

  // Redux error clear karna external-system update hai — effect allowed hai
  useEffect(() => {
    if (isOpen) dispatch(clearCollectionError());
  }, [dispatch, isOpen]);

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const d = "description" in fields ? fields.description : description;
    const t = "type" in fields ? fields.type : type;
    const r = "rules" in fields ? fields.rules : rules;
    const img = "image" in fields ? fields.image : image;

    if (!n.trim()) errs.name = "Collection name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";
    else if (d.trim().length < 5)
      errs.description = "Description must be at least 5 characters.";

    if (t === "automated") {
      if (!r.length) {
        errs.rules = "Automated collection needs at least one rule.";
      } else if (r.some((rule) => String(rule.value ?? "").trim() === "")) {
        errs.rules = "Every rule needs a value.";
      }
    }

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
          : field === "type"
            ? type
            : field === "rules"
              ? rules
              : image;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const updateRule = (index, patch) =>
    setRules((prev) =>
      prev.map((rule, i) => {
        if (i !== index) return rule;
        const next = { ...rule, ...patch };
        // field badla to operator/value reset
        if (patch.field && patch.field !== rule.field) {
          next.operator = (OPERATOR_OPTIONS[patch.field] || [])[0]?.value || "eq";
          next.value = "";
        }
        return next;
      }),
    );

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, description: true, image: true, rules: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("type", type);
    formData.append(
      "rules",
      JSON.stringify(type === "automated" ? rules : []),
    );
    formData.append("showOnHomePage", showOnHomePage);
    formData.append("showAsBadge", showAsBadge);
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
          ? "Update this marketing collection."
          : "Curate products into a marketing collection."
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
        <Field
          label="Collection name"
          required
          htmlFor="col-name"
          error={touched.name ? errors.name : undefined}
          hint={
            name.trim()
              ? `Slug: /${slug}`
              : "This name appears on storefront badges and in the shop filters."
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
            placeholder="e.g. Summer Sale"
            className={`form-input ${touched.name && errors.name ? "is-invalid" : ""}`}
          />
        </Field>

        <Field
          label="Description"
          required
          htmlFor="col-desc"
          error={touched.description ? errors.description : undefined}
          hint={
            description.trim()
              ? `${description.length} / 500 characters`
              : "A short line shown alongside the collection on the storefront."
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
            placeholder="e.g. Light and breathable picks for summer"
            className={`form-textarea ${touched.description && errors.description ? "is-invalid" : ""}`}
          />
        </Field>

        {/* 🆕 Type — manual ya automated */}
        <Field
          label="Collection type"
          required
          hint={
            type === "automated"
              ? "Products matching the conditions below join automatically and stay up to date."
              : "Choose the products for this collection by hand."
          }
        >
          <div className="flex gap-2">
            {[
              { value: "manual", label: "Manual" },
              { value: "automated", label: "Automated" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={type === opt.value}
                onClick={() => {
                  setType(opt.value);
                  revalidate("type", opt.value);
                }}
                onBlur={() => handleBlur("type")}
                className={`choice-pill ${type === opt.value ? "choice-pill-active" : ""}`}
              >
                {type === opt.value && <CheckIcon className="w-3.5 h-3.5" />}
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        {/* 🆕 Rules builder — sirf automated collections ke liye */}
        {type === "automated" && (
          <Field
            label="Membership rules"
            required
            error={touched.rules ? errors.rules : undefined}
            hint="Products that match all of these conditions will become members automatically."
          >
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-(--radius) border border-(--border) bg-(--surface-sunken) p-2"
                >
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(index, { field: e.target.value })}
                    className="form-select flex-1"
                    aria-label="Rule field"
                  >
                    {FIELD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(index, { operator: e.target.value })
                    }
                    className="form-select flex-1"
                    aria-label="Rule operator"
                  >
                    {(OPERATOR_OPTIONS[rule.field] || []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {rule.field === "subCategory" ? (
                    <select
                      value={rule.value}
                      onChange={(e) =>
                        updateRule(index, { value: e.target.value })
                      }
                      className="form-select flex-1"
                      aria-label="Rule value"
                    >
                      <option value="">Select…</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={rule.value}
                      onChange={(e) =>
                        updateRule(index, { value: e.target.value })
                      }
                      placeholder={VALUE_PLACEHOLDERS[rule.field] || ""}
                      className="form-input flex-1"
                      aria-label="Rule value"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setRules((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="icon-btn icon-btn-delete"
                    title="Remove rule"
                    aria-label={`Remove rule ${index + 1}`}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRules((prev) => [...prev, emptyRule()])}
                className="btn btn-outline btn-sm"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add rule
              </button>
            </div>
          </Field>
        )}

        {/* 🆕 Home page curation */}
        <Field
          label="Home page feature"
          optional
          hint="Products in this collection will appear in the “Featured Pieces” section of the home page."
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm text-(--ink-soft)">
            <input
              type="checkbox"
              checked={showOnHomePage}
              onChange={(e) => setShowOnHomePage(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            Show this collection on the home page
          </label>
        </Field>

        {/* 🆕 Dynamic shop badge */}
        <Field
          label="Shop badge"
          optional
          hint="The collection name will appear as a badge on member products across the storefront."
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm text-(--ink-soft)">
            <input
              type="checkbox"
              checked={showAsBadge}
              onChange={(e) => setShowAsBadge(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            Show as badge on product cards
          </label>
        </Field>

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
                setImage(e.target.files[0]);
                revalidate("image", e.target.files[0]);
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

import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import API from "../../api/axios";
import {
  addCategory,
  clearCategoryError,
  updateCategory,
} from "../../features/categories/categoriesSlice";
import useFormSync from "../../hooks/useFormSync";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import Thumb from "../common/Thumb";
import {
  CheckIcon,
  ChevronDownIcon,
  GridIcon,
  ImageIcon,
} from "../common/Icon";

const SUB_OPTIONS = ["Men", "Women"];

const CategoryModal = ({
  isOpen,
  onClose,
  editData,
  // 🆕 Table shortcut — "+" click se aaya preset parent
  presetParent = null,
}) => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(
    (state) => state.categories,
  );

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [gender, setGender] = useState(["Men", "Women"]);
  const [sortOrder, setSortOrder] = useState("0");

  // 🆕 Hierarchy Level Architecture: "root" (Level 1) | "child" (Level 2) | "sub" (Level 3)
  const [level, setLevel] = useState("root");
  const [selectedMainId, setSelectedMainId] = useState("");
  const [parentId, setParentId] = useState("");
  const [isPresetLocked, setIsPresetLocked] = useState(false);

  // Advanced Re-parenting (optional existing category move)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [childId, setChildId] = useState("");

  // Live Slug / Name availability check
  const [slugCheck, setSlugCheck] = useState({ status: "idle", message: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // -------------------------------------------------------------
  // Hierarchy Helpers & Maps
  // -------------------------------------------------------------
  const parentMap = useMemo(() => {
    return new Map(
      categories.map((c) => [
        String(c._id),
        c.parentId ? String(c.parentId._id || c.parentId) : null,
      ]),
    );
  }, [categories]);

  // Root → ... → Node ancestor chain
  const pathOf = (id) => {
    const parts = [];
    let cur = id ? String(id) : null;
    const seen = new Set();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const cat = categories.find((c) => String(c._id) === cur);
      if (!cat) break;
      parts.unshift(cat);
      cur = parentMap.get(cur);
    }
    return parts;
  };

  // Subtree height calculation for edit mode depth guard
  const heightOf = (id) => {
    let max = 0;
    for (const c of categories) {
      if (parentMap.get(String(c._id)) === id) {
        max = Math.max(max, heightOf(String(c._id)) + 1);
      }
    }
    return max;
  };

  const editSubtreeHeight = useMemo(() => {
    return editData ? heightOf(String(editData._id)) : 0;
  }, [editData, categories]);

  // Main Categories (Root / Level 0)
  const mainCategories = useMemo(() => {
    return categories
      .filter((c) => {
        const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
        if (pid) return false;
        if (editData && String(c._id) === String(editData._id)) return false;
        return true;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories, editData]);

  // Sub-Categories under currently selected Main Category
  const availableSubCategories = useMemo(() => {
    if (!selectedMainId) return [];
    return categories
      .filter((c) => {
        const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
        if (pid !== String(selectedMainId)) return false;
        if (editData && String(c._id) === String(editData._id)) return false;
        return true;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  }, [categories, selectedMainId, editData]);

  // -------------------------------------------------------------
  // Form Initialization & Sync
  // -------------------------------------------------------------
  useFormSync(
    `${isOpen}|${editData?._id ?? ""}|${presetParent?._id ?? ""}`,
    () => {
      if (editData) {
        setName(editData.name || "");
        setDescription(editData.description || "");
        setImage(null);
        const seededGender = editData.gender ?? editData.subCategories;
        setGender(seededGender?.length ? seededGender : ["Men", "Women"]);

        const rawPid = editData.parentId
          ? String(editData.parentId?._id || editData.parentId)
          : "";
        setParentId(rawPid);

        if (!rawPid) {
          setLevel("root");
          setSelectedMainId("");
        } else {
          const parentChain = pathOf(rawPid);
          if (parentChain.length <= 1) {
            // Parent is a Main Category -> this editData is Sub-Category (Level 1)
            setLevel("child");
            setSelectedMainId(rawPid);
          } else {
            // Parent is a Sub-Category -> this editData is Sub-Child (Level 2)
            setLevel("sub");
            setSelectedMainId(String(parentChain[0]._id));
          }
        }
        setIsPresetLocked(false);
      } else if (presetParent) {
        setName("");
        setDescription("");
        setImage(null);
        setGender(["Men", "Women"]);
        const presetPid = String(presetParent._id);
        const chain = pathOf(presetPid);

        if (chain.length <= 1) {
          // Preset parent is root -> Adding Sub-Category
          setLevel("child");
          setSelectedMainId(presetPid);
          setParentId(presetPid);
        } else {
          // Preset parent is child -> Adding Sub-Child
          setLevel("sub");
          setSelectedMainId(String(chain[0]._id));
          setParentId(presetPid);
        }
        setIsPresetLocked(true);
      } else {
        // Fresh Create Form
        setName("");
        setDescription("");
        setImage(null);
        setGender(["Men", "Women"]);
        setLevel("root");
        setParentId("");
        setSelectedMainId(mainCategories[0] ? String(mainCategories[0]._id) : "");
        setIsPresetLocked(false);
      }

      setSortOrder(editData ? String(editData.sortOrder ?? 0) : "0");
      setChildId("");
      setShowAdvanced(false);
      setErrors({});
      setTouched({});
    },
  );

  useEffect(() => {
    if (isOpen) dispatch(clearCategoryError());
  }, [dispatch, isOpen]);

  // -------------------------------------------------------------
  // Live Slug & Name Availability Check
  // -------------------------------------------------------------
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  useEffect(() => {
    if (!isOpen || !name.trim()) {
      setSlugCheck({ status: "idle", message: "" });
      return undefined;
    }
    const timer = setTimeout(async () => {
      setSlugCheck({ status: "checking", message: "Checking availability…" });
      try {
        const { data } = await API.get("/categories/admin/check-slug", {
          params: {
            slug,
            name: name.trim(),
            ...(editData?._id ? { excludeId: editData._id } : {}),
          },
        });
        setSlugCheck(
          data.available
            ? { status: "available", message: "Available" }
            : {
                status: "taken",
                message: data.nameTaken
                  ? "A category with this name already exists"
                  : "This slug is already in use",
              },
        );
      } catch {
        setSlugCheck({ status: "idle", message: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen, name, slug, editData]);

  // -------------------------------------------------------------
  // Level Switching Handler
  // -------------------------------------------------------------
  const handleSelectLevel = (newLevel) => {
    setLevel(newLevel);
    setIsPresetLocked(false);
    setErrors((prev) => ({ ...prev, parentId: undefined }));

    if (newLevel === "root") {
      setParentId("");
      setSelectedMainId("");
    } else if (newLevel === "child") {
      const targetMain = selectedMainId || (mainCategories[0] ? String(mainCategories[0]._id) : "");
      setSelectedMainId(targetMain);
      setParentId(targetMain);
    } else if (newLevel === "sub") {
      const targetMain = selectedMainId || (mainCategories[0] ? String(mainCategories[0]._id) : "");
      setSelectedMainId(targetMain);
      const kids = categories.filter((c) => {
        const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
        return pid === String(targetMain) && (!editData || String(c._id) !== String(editData._id));
      });
      setParentId(kids[0] ? String(kids[0]._id) : "");
    }
  };

  // -------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------
  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const d = "description" in fields ? fields.description : description;
    const img = "image" in fields ? fields.image : image;
    const subs = "gender" in fields ? fields.gender : gender;
    const lvl = "level" in fields ? fields.level : level;
    const pid = "parentId" in fields ? fields.parentId : parentId;

    if (!n.trim()) errs.name = "Category name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!d.trim()) errs.description = "Description is required.";
    else if (d.trim().length < 5)
      errs.description = "Description must be at least 5 characters.";

    if (!subs.length)
      errs.gender = "Select at least one gender (Men or Women).";

    if (!editData && !img) errs.image = "Please select a category image.";

    if (lvl === "child" && !pid) {
      errs.parentId = "Please select a parent Main Category.";
    }

    if (lvl === "sub" && !pid) {
      errs.parentId = "Please select a parent Sub-Category.";
    }

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
          : field === "gender"
            ? gender
            : image;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const toggleGender = (value) => {
    setGender((prev) => {
      const next = prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value];
      if (touched.gender) {
        const errs = validate({ gender: next });
        setErrors((prevErrs) => ({ ...prevErrs, gender: errs.gender }));
      }
      return next;
    });
  };

  // -------------------------------------------------------------
  // Live Placement Preview Details
  // -------------------------------------------------------------
  const activeParentChain = parentId ? pathOf(parentId) : [];
  const breadcrumbChain = [
    ...activeParentChain.map((c) => c.name),
    name.trim() || "New Category",
  ];
  const urlSlugPath = [
    ...activeParentChain.map((c) => c.slug),
    slug || "new-category",
  ].join("/");

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      description: true,
      image: true,
      gender: true,
      parentId: true,
    });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (slugCheck.status === "taken") {
      setErrors((prev) => ({
        ...prev,
        name: `${slugCheck.message}. Please pick a different name.`,
      }));
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug);
    formData.append("description", description.trim());
    formData.append("gender", JSON.stringify(gender));
    formData.append("parentId", parentId);
    formData.append("sortOrder", sortOrder === "" ? "0" : sortOrder);
    if (childId) formData.append("childId", childId);
    if (image) formData.append("image", image);

    const action = editData
      ? updateCategory({ id: editData._id, data: formData })
      : addCategory(formData);

    dispatch(action).then((res) => {
      if (!res.error) onClose();
    });
  };

  // -------------------------------------------------------------
  // Guard Checks for Level Selector (Edit Mode)
  // -------------------------------------------------------------
  const hasSubCategories = mainCategories.length > 0;
  const isChildDisabled = editData && editSubtreeHeight >= 2;
  const isSubChildDisabled =
    (!hasSubCategories && level !== "sub") || (editData && editSubtreeHeight >= 1);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<GridIcon className="w-4 h-4" />}
      title={editData ? "Edit category" : "New category"}
      subtitle={
        editData
          ? "Update details, hierarchy placement, or storefront visibility."
          : "Create a main category, sub-category, or sub-child for your catalog."
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
        {/* Category Name */}
        <Field
          label="Category name"
          required
          htmlFor="cat-name"
          error={touched.name ? errors.name : undefined}
          hint={name.trim() ? `Slug: /${slug}` : "Used in the storefront menu and catalog filters."}
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
            placeholder="e.g. Duffel Bags, Backpacks, Luggage"
            className={`form-input ${
              touched.name && errors.name ? "is-invalid" : ""
            }`}
          />
          {name.trim() && slugCheck.status !== "idle" && (
            <p
              className={`mt-1.5 text-[11px] font-medium ${
                slugCheck.status === "taken"
                  ? "text-red-500"
                  : slugCheck.status === "available"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-(--ink-faint)"
              }`}
            >
              {slugCheck.message}
              {slugCheck.status !== "checking" ? ` — Slug: /${slug}` : ""}
            </p>
          )}
        </Field>

        {/* ══════════════════════════════════════════════════════════
            ✨ UPGRADED HIERARCHY LEVEL SELECTOR (Visual & Foolproof)
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[12.5px] font-bold text-(--ink) mb-0.5">
              Category Hierarchy Level <span className="text-red-500">*</span>
            </label>
            <p className="text-[11.5px] text-(--ink-muted) mb-2.5">
              Choose where this category lives in your store structure.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Main Category */}
              <button
                type="button"
                onClick={() => handleSelectLevel("root")}
                className={`hierarchy-card ${
                  level === "root" ? "hierarchy-card-active" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[12.5px] text-(--ink)">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
                    Main
                  </span>
                  <span className="badge-hierarchy-root text-[10px] py-0 px-1.5">
                    Level 1
                  </span>
                </div>
                <p className="text-[11px] text-(--ink-muted) leading-snug">
                  Top-level department (e.g. Bags, Luggage)
                </p>
              </button>

              {/* Option 2: Sub-Category */}
              <button
                type="button"
                onClick={() => handleSelectLevel("child")}
                disabled={isChildDisabled || !hasSubCategories}
                title={
                  !hasSubCategories
                    ? "Create a Main Category first"
                    : isChildDisabled
                      ? "Cannot move: category has deep children"
                      : "Create under a Main Category"
                }
                className={`hierarchy-card ${
                  level === "child" ? "hierarchy-card-active" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[12.5px] text-(--ink)">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shadow-xs" />
                    Sub-Category
                  </span>
                  <span className="badge-hierarchy-child text-[10px] py-0 px-1.5">
                    Level 2
                  </span>
                </div>
                <p className="text-[11px] text-(--ink-muted) leading-snug">
                  Under a Main Category (e.g. Bags › Handbags)
                </p>
              </button>

              {/* Option 3: Sub-Child */}
              <button
                type="button"
                onClick={() => handleSelectLevel("sub")}
                disabled={isSubChildDisabled}
                title={
                  isSubChildDisabled
                    ? editData
                      ? "Cannot move: category already has sub-categories"
                      : "Create a Sub-Category first"
                    : "Create under a Sub-Category"
                }
                className={`hierarchy-card ${
                  level === "sub" ? "hierarchy-card-active" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[12.5px] text-(--ink)">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
                    Sub-Child
                  </span>
                  <span className="badge-hierarchy-sub text-[10px] py-0 px-1.5">
                    Level 3
                  </span>
                </div>
                <p className="text-[11px] text-(--ink-muted) leading-snug">
                  Deepest style (e.g. Laptop Backpacks)
                </p>
              </button>
            </div>
          </div>

          {/* Level Details & Adaptive Parent Selectors */}
          {level === "root" && (
            <div className="p-3 rounded-xl border border-(--border) bg-(--surface-sunken)/60 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-(--ink)">
                  Creating as Top-Level Main Category
                </p>
                <p className="text-[11.5px] text-(--ink-muted) mt-0.5">
                  This category will appear directly in your main storefront menu bar. No parent selection is needed.
                </p>
              </div>
            </div>
          )}

          {level === "child" && (
            <div className="p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/20 dark:bg-sky-950/20 space-y-2">
              <label className="block text-[12px] font-bold text-(--ink)">
                Select Parent Main Category <span className="text-red-500">*</span>
              </label>
              <select
                value={parentId}
                onChange={(e) => {
                  setParentId(e.target.value);
                  setSelectedMainId(e.target.value);
                  revalidate("parentId", e.target.value);
                }}
                disabled={presetParent && isPresetLocked}
                className={`form-select font-medium ${
                  touched.parentId && errors.parentId ? "is-invalid" : ""
                }`}
              >
                <option value="" disabled>
                  -- Select Main Category (e.g. Bags) --
                </option>
                {mainCategories.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {touched.parentId && errors.parentId && (
                <p className="text-[11px] text-red-500 font-medium">
                  {errors.parentId}
                </p>
              )}

              {presetParent && isPresetLocked && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                    🔒 Pre-selected: “{presetParent.name}” (from table shortcut)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPresetLocked(false)}
                    className="text-[11px] text-(--ink-muted) hover:text-(--brand) underline cursor-pointer"
                  >
                    Unlock / change
                  </button>
                </div>
              )}
            </div>
          )}

          {level === "sub" && (
            <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[12px] font-bold text-(--ink)">
                  Select Parent Sub-Category Chain
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-(--ink-soft) mb-1">
                    1. Main Department:
                  </label>
                  <select
                    value={selectedMainId}
                    onChange={(e) => {
                      const newMain = e.target.value;
                      setSelectedMainId(newMain);
                      const kids = categories.filter((c) => {
                        const pid = c.parentId ? String(c.parentId._id || c.parentId) : null;
                        return pid === String(newMain) && (!editData || String(c._id) !== String(editData._id));
                      });
                      const newPid = kids[0] ? String(kids[0]._id) : "";
                      setParentId(newPid);
                      revalidate("parentId", newPid);
                    }}
                    disabled={presetParent && isPresetLocked}
                    className="form-select text-[12.5px]"
                  >
                    <option value="" disabled>-- Choose Main Category --</option>
                    {mainCategories.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-(--ink-soft) mb-1">
                    2. Parent Sub-Category: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => {
                      setParentId(e.target.value);
                      revalidate("parentId", e.target.value);
                    }}
                    disabled={!selectedMainId || (presetParent && isPresetLocked)}
                    className={`form-select text-[12.5px] ${
                      touched.parentId && errors.parentId ? "is-invalid" : ""
                    }`}
                  >
                    <option value="" disabled>
                      {!selectedMainId
                        ? "-- Select Main First --"
                        : availableSubCategories.length === 0
                          ? "-- No Sub-Categories Found --"
                          : "-- Select Sub-Category --"}
                    </option>
                    {availableSubCategories.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {touched.parentId && errors.parentId && (
                <p className="text-[11px] text-red-500 font-medium">
                  {errors.parentId}
                </p>
              )}

              {selectedMainId && availableSubCategories.length === 0 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  ⚠ The selected Main Category has no sub-categories yet. Please create a Sub-Category under it first before creating a Sub-Child.
                </p>
              )}

              {presetParent && isPresetLocked && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    🔒 Pre-selected under “{presetParent.name}”
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPresetLocked(false)}
                    className="text-[11px] text-(--ink-muted) hover:text-(--brand) underline cursor-pointer"
                  >
                    Unlock / change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Interactive Live Placement Preview Card */}
          <div className="rounded-xl border border-(--border) bg-(--surface-card) p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-(--ink-faint)">
                Hierarchy Placement Preview
              </span>
              <span
                className={
                  level === "root"
                    ? "badge-hierarchy-root"
                    : level === "child"
                      ? "badge-hierarchy-child"
                      : "badge-hierarchy-sub"
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    level === "root"
                      ? "bg-indigo-500"
                      : level === "child"
                        ? "bg-sky-500"
                        : "bg-amber-500"
                  }`}
                />
                {level === "root"
                  ? "Main Category"
                  : level === "child"
                    ? "Sub-Category"
                    : "Sub-Child"}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 text-[13px] font-semibold text-(--ink) py-1">
              {breadcrumbChain.map((item, idx) => (
                <Fragment key={idx}>
                  {idx > 0 && (
                    <span className="text-slate-400 dark:text-slate-500 font-normal select-none">
                      ›
                    </span>
                  )}
                  <span
                    className={
                      idx === breadcrumbChain.length - 1
                        ? "text-(--brand) font-bold"
                        : "text-(--ink-soft)"
                    }
                  >
                    {item}
                  </span>
                </Fragment>
              ))}
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-(--ink-faint)">
              <span>URL:</span>
              <span className="bg-(--surface-sunken) px-1.5 py-0.5 rounded text-(--ink-soft) truncate max-w-full">
                /{urlSlugPath}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <Field
          label="Description"
          required
          htmlFor="cat-desc"
          error={touched.description ? errors.description : undefined}
          hint={
            description.trim()
              ? `${description.length} / 500 characters`
              : "Shown on the collection banner to help shoppers browse."
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
            placeholder="A short line shoppers see when viewing this collection…"
            className={`form-textarea ${
              touched.description && errors.description ? "is-invalid" : ""
            }`}
          />
        </Field>

        {/* Gender Choice Pills */}
        <Field
          label="Target Gender"
          required
          hint="Which genders or departments this collection covers."
          error={touched.gender ? errors.gender : undefined}
        >
          <div className="flex gap-2">
            {SUB_OPTIONS.map((option) => {
              const selected = gender.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleGender(option)}
                  onBlur={() => handleBlur("gender")}
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

        {/* Sort Order */}
        <Field
          label="Sort order"
          optional
          hint="Lower numbers appear first in storefront menus and category listings (0 = first)."
        >
          <input
            type="number"
            min="0"
            max="9999"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="form-input"
          />
        </Field>

        {/* Category Image Dropzone */}
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
                  PNG, JPG or WEBP up to 5 MB
                </p>
              </>
            )}
          </div>
        </Field>

        {/* ══════════════════════════════════════════════════════════
            ⚙️ OPTIONAL ADVANCED SECTION: RE-PARENT EXISTING CATEGORY
            (Only for Level 1 & Level 2 - Clean & Unobtrusive)
            ══════════════════════════════════════════════════════════ */}
        {level !== "sub" && (
          <div className="border-t border-(--border) pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold text-(--ink-muted) hover:text-(--brand) cursor-pointer"
            >
              <ChevronDownIcon
                className={`w-3.5 h-3.5 transition-transform ${
                  showAdvanced ? "" : "-rotate-90"
                }`}
              />
              <span>Advanced: Re-parent an existing category under this one</span>
            </button>

            {showAdvanced && (
              <div className="mt-2.5 p-3 rounded-xl border border-(--border) bg-(--surface-sunken)/40 space-y-1.5">
                <p className="text-[11px] text-(--ink-muted)">
                  Optional: Pick an existing category to move it directly under this category.
                </p>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="form-select text-[12.5px]"
                >
                  <option value="">None (Do not move any existing category)</option>
                  {categories
                    .filter((c) => {
                      if (editData && String(c._id) === String(editData._id)) return false;
                      if (parentId && String(c._id) === String(parentId)) return false;
                      return true;
                    })
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        )}
      </form>
    </Drawer>
  );
};

export default CategoryModal;

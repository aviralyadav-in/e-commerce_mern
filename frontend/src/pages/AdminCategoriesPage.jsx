import { useEffect, useState } from "react";
import client from "../api/client";

const BACKEND_URL = "http://localhost:4000";

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    status: "active",
  });

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await client.get("/categories");
      setCategories(res.data.categories ?? []);
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          "Unable to fetch categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      image: event.target.files?.[0] ?? null,
    }));
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      image: null,
      status: category.status || "active",
    });
    setFormKey(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", image: null, status: "active" });
    setEditingCategoryId(null);
    setFormKey(Date.now());
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("status", formData.status);
      if (formData.image) {
        payload.append("image", formData.image);
      }

      const endpoint = editingCategoryId
        ? `/categories/admin/${editingCategoryId}`
        : "/categories/admin";
      const method = editingCategoryId ? "put" : "post";

      const response = await client[method](endpoint, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (editingCategoryId) {
        setCategories((prev) =>
          prev.map((category) =>
            category._id === editingCategoryId
              ? response.data.category
              : category,
          ),
        );
        setMessage(response.data.message || "Category updated successfully.");
      } else {
        setCategories((prev) => [response.data.category, ...prev]);
        setMessage(response.data.message || "Category created successfully.");
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id, categoryName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${categoryName}"?\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await client.delete(`/categories/admin/${id}`);

      setCategories((prev) => prev.filter((category) => category._id !== id));
      setMessage(response.data.message || "Category deleted successfully.");

      if (editingCategoryId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message ||
          "Unable to delete category. It might be linked to existing products.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-350 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-8 rounded-full bg-orange-500"></div>
            <p className="text-sm uppercase tracking-widest font-bold text-orange-500">
              Admin Workspace
            </p>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mt-2">
            Manage Categories
          </h1>
          <p className="max-w-2xl text-slate-400 mt-1">
            Create, update, and manage product categories. Ensure your catalog
            structure is ready before adding new products.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
          {/* Left Panel: Form Section */}
          <section className="h-fit sticky top-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingCategoryId ? "Edit Category" : "New Category"}
                </h2>
                {editingCategoryId && (
                  <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500">
                    Editing Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {editingCategoryId
                  ? "Update the details below. Leave the image empty to keep the current one."
                  : "Fill in the details to add a new category to your storefront."}
              </p>
            </div>

            {(message || error) && (
              <div
                className={`mb-6 rounded-2xl px-5 py-4 text-sm font-medium ${
                  message
                    ? "border border-green-500/20 bg-green-500/10 text-green-400"
                    : "border border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {message || error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Category Name <span className="text-orange-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Summer Collection"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Briefly describe this category..."
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 placeholder-slate-600 resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Category Image
                </label>
                <input
                  key={formKey}
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-300 transition focus:border-orange-500 focus:bg-slate-950
                  file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-slate-700 file:cursor-pointer file:transition"
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 items-center justify-center rounded-2xl border border-slate-700 bg-transparent px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                >
                  {saving
                    ? editingCategoryId
                      ? "Updating..."
                      : "Saving..."
                    : editingCategoryId
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </section>

          {/* Right Panel: Table Section */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">
                Category Directory
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                A complete list of all your storefront categories.
              </p>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-orange-500"></div>
                  <span className="font-medium text-sm animate-pulse">
                    Loading directory...
                  </span>
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                <div className="h-16 w-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="font-bold text-white">No categories found</p>
                <p className="text-sm mt-1 text-slate-400">
                  Use the form to create your first one.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Image</th>
                      <th className="px-6 py-4 font-semibold">Details</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Created</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {categories.map((category) => (
                      <tr
                        key={category._id}
                        className={`transition-colors hover:bg-slate-800/30 ${
                          editingCategoryId === category._id
                            ? "bg-slate-800/50"
                            : ""
                        }`}
                      >
                        {/* Column 1: Image */}
                        <td className="px-6 py-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                            {category.image ? (
                              <img
                                src={
                                  category.image.startsWith("http")
                                    ? category.image
                                    : `${BACKEND_URL}${category.image}`
                                }
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] uppercase font-bold text-slate-600">
                                No Img
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 2: Details */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-base">
                            {category.name}
                          </p>
                          <p
                            className="text-slate-400 text-xs mt-0.5 truncate max-w-50"
                            title={category.description}
                          >
                            {category.description || "No description provided."}
                          </p>
                        </td>

                        {/* Column 3: Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              category.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-700 text-slate-300 border border-slate-600"
                            }`}
                          >
                            {category.status || "active"}
                          </span>
                        </td>

                        {/* Column 4: Date */}
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(category.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>

                        {/* Column 5: Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === category._id}
                              onClick={() =>
                                handleDeleteCategory(
                                  category._id,
                                  category.name,
                                )
                              }
                              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                            >
                              {deletingId === category._id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminCategoriesPage;

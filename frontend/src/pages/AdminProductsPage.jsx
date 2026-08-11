import { useEffect, useState } from "react";
import client from "../api/client";

const BACKEND_URL = "http://localhost:4000";

function AdminProductsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "0",
    status: "active",
    images: [],
  });

  const [editingProductId, setEditingProductId] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, productsResponse] = await Promise.all([
        client.get("/categories"),
        client.get("/products"),
      ]);
      setCategories(categoriesResponse.data.categories ?? []);
      setProducts(productsResponse.data.products ?? []);
    } catch (fetchError) {
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      images: event.target.files ? Array.from(event.target.files) : [],
    }));
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category: product.category?._id || product.category || "",
      stock: product.stock?.toString() || "0",
      status: product.status || "active",
      images: [],
    });
    setFileInputKey(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "0",
      status: "active",
      images: [],
    });
    setEditingProductId(null);
    setFileInputKey(Date.now());
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError("Enter a valid price greater than 0.");
      return;
    }

    if (formData.stock === "" || Number(formData.stock) < 0) {
      setError("Stock must be 0 or greater.");
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("price", formData.price);
      payload.append("stock", formData.stock);
      payload.append("status", formData.status);
      payload.append("category", formData.category);

      formData.images.forEach((image) => {
        payload.append("images", image);
      });

      const endpoint = editingProductId
        ? `/products/admin/${editingProductId}`
        : "/products/admin";
      const method = editingProductId ? "put" : "post";

      const response = await client[method](endpoint, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (editingProductId) {
        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProductId ? response.data.product : product,
          ),
        );
        setMessage(response.data.message || "Product updated successfully.");
      } else {
        setProducts((prev) => [response.data.product, ...prev]);
        setMessage(response.data.message || "Product added successfully.");
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Nayi Delete Functionality
  const handleDeleteProduct = async (id, productName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}"?\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await client.delete(`/products/admin/${id}`);

      setProducts((prev) => prev.filter((product) => product._id !== id));
      setMessage(response.data.message || "Product deleted successfully.");

      if (editingProductId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(
        deleteError?.response?.data?.message || "Unable to delete product.",
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
            Manage Inventory
          </h1>
          <p className="max-w-2xl text-slate-400 mt-1">
            Create, update, and review products in your storefront. Keep your
            inventory fresh and organized.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[400px_1fr]">
          {/* Left Panel: Form Section */}
          <section className="h-fit sticky top-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingProductId ? "Edit Product" : "New Product"}
                </h2>
                {editingProductId && (
                  <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500">
                    Editing Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {editingProductId
                  ? "Update product details. Upload new images only if you want to replace the current ones."
                  : "Fill in the details to add a new product to your storefront."}
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
                  Product Name <span className="text-orange-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Vintage Leather Jacket"
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
                  placeholder="Describe this product..."
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 placeholder-slate-600 resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-semibold text-slate-300"
                  >
                    Price (₹) <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="999.00"
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-semibold text-slate-300"
                  >
                    Stock <span className="text-orange-500">*</span>
                  </label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="0"
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-slate-300"
                  >
                    Category <span className="text-orange-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-slate-950 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-semibold text-slate-300"
                >
                  Product Images
                </label>
                <input
                  key={fileInputKey}
                  id="images"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm text-slate-300 transition focus:border-orange-500 focus:bg-slate-950
                  file:mr-4 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-slate-700 file:cursor-pointer file:transition"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Upload up to 5 images.{" "}
                  {editingProductId && "Leave empty to keep current."}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
                {editingProductId && (
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
                    ? editingProductId
                      ? "Updating..."
                      : "Saving..."
                    : editingProductId
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </section>

          {/* Right Panel: Table Section */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">
                Product Directory
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                A complete list of all products in your inventory.
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
            ) : products.length === 0 ? (
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <p className="font-bold text-white">No products found</p>
                <p className="text-sm mt-1 text-slate-400">
                  Use the form to add your first product.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Image</th>
                      <th className="px-6 py-4 font-semibold">
                        Product Details
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Pricing & Stock
                      </th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {products.map((product) => (
                      <tr
                        key={product._id}
                        className={`transition-colors hover:bg-slate-800/30 ${
                          editingProductId === product._id
                            ? "bg-slate-800/50"
                            : ""
                        }`}
                      >
                        {/* Column 1: Image */}
                        <td className="px-6 py-4">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 relative group">
                            {product.images?.[0] ? (
                              <>
                                <img
                                  src={
                                    product.images[0].startsWith("http")
                                      ? product.images[0]
                                      : `${BACKEND_URL}${product.images[0]}`
                                  }
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                                {product.images.length > 1 && (
                                  <div className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                                    +{product.images.length - 1}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] uppercase font-bold text-slate-600">
                                No Img
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 2: Details */}
                        <td className="px-6 py-4">
                          <p
                            className="font-bold text-white text-base truncate max-w-50"
                            title={product.name}
                          >
                            {product.name}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            {product.category?.name ?? "Uncategorized"}
                          </p>
                        </td>

                        {/* Column 3: Price & Stock */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-orange-400 text-base">
                            ₹{product.price}
                          </p>
                          <p
                            className={`text-xs mt-0.5 font-semibold ${product.stock > 10 ? "text-slate-400" : product.stock > 0 ? "text-yellow-500" : "text-red-500"}`}
                          >
                            {product.stock > 0
                              ? `Stock: ${product.stock}`
                              : "Out of Stock"}
                          </p>
                        </td>

                        {/* Column 4: Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              product.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : product.status === "draft"
                                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                  : "bg-slate-700 text-slate-300 border border-slate-600"
                            }`}
                          >
                            {product.status || "active"}
                          </span>
                        </td>

                        {/* Column 5: Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === product._id}
                              onClick={() =>
                                handleDeleteProduct(product._id, product.name)
                              }
                              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                            >
                              {deletingId === product._id ? "..." : "Delete"}
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

export default AdminProductsPage;

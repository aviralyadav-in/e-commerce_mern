import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice"; // Ensure logoutUser is exported from your slice
import client from "../api/client";

function AdminDashboardPage() {
  const [stats, setStats] = useState({ categories: 0, products: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          client.get("/categories"),
          client.get("/products"),
        ]);

        setStats({
          categories:
            categoriesResponse.data.count ??
            categoriesResponse.data.categories?.length ??
            0,
          products: productsResponse.data.products?.length ?? 0,
        });
      } catch (fetchError) {
        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            "Unable to load dashboard summary.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await dispatch(logoutUser()); // Redux action for logout
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-350 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Section with Logout */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-8 rounded-full bg-orange-500"></div>
              <p className="text-sm uppercase tracking-widest font-bold text-orange-500">
                Admin Dashboard
              </p>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl mt-3">
              Store Overview
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-400 leading-relaxed">
              Manage your categories, review inventory, and keep your catalog
              fully updated from a single control center.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Stats Section */}
        {loading ? (
          <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-12 flex flex-col items-center justify-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-orange-500 mb-3"></div>
            <span className="animate-pulse font-medium">Syncing data...</span>
          </div>
        ) : error ? (
          <div className="mb-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-400 font-medium">
            {error}
          </div>
        ) : (
          <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Stat Card 1 */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl"></div>
              <p className="text-sm uppercase tracking-widest font-bold text-slate-500">
                Categories
              </p>
              <p className="mt-4 text-6xl font-black text-white">
                {stats.categories}
              </p>
              <p className="mt-4 text-sm text-slate-400 font-medium">
                Active categories structured.
              </p>
            </div>

            {/* Stat Card 2 */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl"></div>
              <p className="text-sm uppercase tracking-widest font-bold text-slate-500">
                Products
              </p>
              <p className="mt-4 text-6xl font-black text-white">
                {stats.products}
              </p>
              <p className="mt-4 text-sm text-slate-400 font-medium">
                Items available for customers.
              </p>
            </div>

            {/* Stat Card 3 */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"></div>
              <p className="text-sm uppercase tracking-widest font-bold text-slate-500">
                System Status
              </p>
              <p className="mt-4 text-5xl font-black text-white flex items-center gap-3">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
                </span>
                Online
              </p>
              <p className="mt-5 text-sm text-slate-400 font-medium">
                All services running smoothly.
              </p>
            </div>
          </div>
        )}

        {/* Quick Links Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Link
            to="/admin/categories"
            className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_10px_30px_-10px_rgba(249,115,22,0.2)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest font-bold text-orange-500">
                  Directory
                </p>
                <h2 className="mt-2 text-2xl font-black text-white transition-colors group-hover:text-orange-400">
                  Manage Categories
                </h2>
              </div>
              <div className="rounded-2xl bg-orange-500/10 p-4 text-2xl text-orange-500 transition-transform group-hover:scale-110">
                📁
              </div>
            </div>
            <p className="mt-6 text-slate-400 leading-relaxed">
              Create new categories, upload cover images, and organize how your
              products are grouped on the frontend.
            </p>
          </Link>

          <Link
            to="/admin/products"
            className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-[0_10px_30px_-10px_rgba(249,115,22,0.2)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest font-bold text-orange-500">
                  Inventory
                </p>
                <h2 className="mt-2 text-2xl font-black text-white transition-colors group-hover:text-orange-400">
                  Manage Products
                </h2>
              </div>
              <div className="rounded-2xl bg-orange-500/10 p-4 text-2xl text-orange-500 transition-transform group-hover:scale-110">
                🛒
              </div>
            </div>
            <p className="mt-6 text-slate-400 leading-relaxed">
              Add new items, adjust pricing, update stock levels, and attach
              multiple high-quality images.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

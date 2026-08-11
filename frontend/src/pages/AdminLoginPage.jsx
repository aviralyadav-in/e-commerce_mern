import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, loginUser } from "../redux/slices/authSlice";

function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth,
  );

  const [clientError, setClientError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const { email, password } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Invalid email format.";
    if (!password.trim()) return "Password is required.";
    return "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (clientError) setClientError("");
    if (error) dispatch(clearAuthError());
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(clearAuthError());

    const validationError = validateForm();
    if (validationError) {
      setClientError(validationError);
      return;
    }

    await dispatch(
      loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }),
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Side: Branding & Graphics (Visible on Desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 border-r border-slate-800 p-12 lg:flex lg:w-1/2">
        {/* Abstract Glowing Orbs */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />

        <div className="relative z-10">
          <Link
            to="/"
            className="text-3xl font-black tracking-tight text-white flex items-center gap-2"
          >
            <div className="h-6 w-6 rounded-md bg-orange-500"></div>
            ShopSphere
          </Link>
          <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">
            Authorized Personnel Only
          </p>
        </div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs uppercase tracking-wider font-bold text-orange-400">
            <span className="animate-pulse h-2 w-2 rounded-full bg-orange-500"></span>
            Admin Portal
          </div>
          <h1 className="text-4xl font-black leading-tight text-white xl:text-6xl">
            Welcome back,
            <span className="block text-orange-500 mt-2">Commander.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400 max-w-md">
            Enter your credentials to access the central dashboard, manage
            inventory, and oversee store operations.
          </p>

          <div className="mt-12 space-y-6">
            {[
              {
                icon: "📦",
                title: "Inventory Control",
                desc: "Real-time updates to product stock and pricing.",
              },
              {
                icon: "🗂️",
                title: "Category Management",
                desc: "Organize storefront for better customer experience.",
              },
              {
                icon: "🔐",
                title: "Secure Access",
                desc: "Encrypted connection and role-based routing.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-xl shadow-inner">
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-white text-base">{item.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16 relative">
        {/* Mobile Header */}
        <div className="mb-10 lg:hidden flex flex-col items-center">
          <div className="h-10 w-10 mb-4 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/30">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            ShopSphere
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mt-1">
            Admin Portal
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-white">Admin Sign In</h2>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Enter your registered email and password to access the dashboard
              securely.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-300"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@shopsphere.com"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-white placeholder-slate-600 outline-none transition focus:border-orange-500 focus:bg-slate-900 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-white placeholder-slate-600 outline-none transition focus:border-orange-500 focus:bg-slate-900 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Error Message Box */}
            {(clientError || error) && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
                <span className="text-red-500 mt-0.5">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </span>
                <p className="text-sm font-bold text-red-400">
                  {clientError || error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center rounded-2xl bg-orange-500 px-4 py-4 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-5 w-5 mr-3 animate-spin text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Access Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;

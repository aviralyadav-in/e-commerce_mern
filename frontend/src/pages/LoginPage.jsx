import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, loginUser } from "../redux/slices/authSlice";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  const [clientError, setClientError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const redirectTo = location.state?.from?.pathname || "/";

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

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
    <div className="flex min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Left Panel - Decorative */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-600 via-violet-600 to-indigo-800 p-12 lg:flex lg:w-1/2">
        {/* Background decorations */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link
            to="/"
            className="text-3xl font-black tracking-tight text-white"
          >
            ShopSphere
          </Link>
          <p className="mt-2 text-indigo-200">Premium Shopping Experience</p>
        </div>

        {/* Center Content */}
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            👋 Welcome Back!
          </div>
          <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl">
            Sign in to your
            <span className="block text-amber-300">ShopSphere account</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-indigo-200">
            Access your orders, wishlist, and enjoy a seamless shopping
            experience tailored just for you.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-4">
            {[
              {
                icon: "🔐",
                title: "Secure Authentication",
                desc: "Cookie-based secure login",
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Instant access to your account",
              },
              {
                icon: "🛍️",
                title: "Smart Shopping",
                desc: "Personalized recommendations",
              },
              {
                icon: "📱",
                title: "Any Device",
                desc: "Seamless across all screens",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg backdrop-blur-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-indigo-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "10K+", label: "Happy Users" },
            { value: "50K+", label: "Products" },
            { value: "99%", label: "Satisfaction" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm"
            >
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-indigo-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        {/* Mobile Logo */}
        <div className="mb-8 lg:hidden">
          <Link to="/" className="text-3xl font-black tracking-tight">
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              ShopSphere
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white">Welcome back</h2>
            <p className="mt-2 text-slate-400">
              Sign in to continue to ShopSphere
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-300"
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
                placeholder="john@example.com"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-300"
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
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Error Message */}
            {(clientError || error) && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <span className="mt-0.5 text-red-400">⚠️</span>
                <p className="text-sm font-medium text-red-400">
                  {clientError || error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
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
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-indigo-400 transition hover:text-indigo-300 hover:underline"
            >
              Create Account →
            </Link>
          </p>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: "🔒", label: "Secure Login" },
              { icon: "⚡", label: "Fast Access" },
              { icon: "🛡️", label: "Safe Shopping" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-800/50 p-3"
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-xs font-medium text-slate-400">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

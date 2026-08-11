import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, signupUser } from "../redux/slices/authSlice";

function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  const [clientError, setClientError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const { name, email, password } = formData;
    if (!name.trim()) return "Name is required.";
    if (name.trim().length < 2) return "Name must be at least 2 characters.";
    if (name.trim().length > 50) return "Name cannot exceed 50 characters.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Invalid email format.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password))
      return "Password must contain at least one uppercase letter, one number, and one special character.";
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
      signupUser({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      }),
    );
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Left Panel - Decorative */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-violet-600 via-indigo-600 to-violet-800 p-12 lg:flex lg:w-1/2">
        {/* Background Decorations */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link
            to="/"
            className="text-3xl font-black tracking-tight text-white"
          >
            ShopSphere
          </Link>
          <p className="mt-2 text-violet-200">Premium Shopping Experience</p>
        </div>

        {/* Center Content */}
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            🚀 Join Today - It's Free!
          </div>
          <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl">
            Start your
            <span className="block text-emerald-300">shopping journey</span>
            today.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-violet-200">
            Create your account in seconds and unlock access to thousands of
            premium products with fast delivery.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-4">
            {[
              {
                icon: "🎁",
                title: "Exclusive Deals",
                desc: "Member-only offers & discounts",
              },
              {
                icon: "🚚",
                title: "Fast Delivery",
                desc: "Quick & reliable shipping",
              },
              {
                icon: "🔄",
                title: "Easy Returns",
                desc: "Hassle-free return policy",
              },
              {
                icon: "💳",
                title: "Secure Payments",
                desc: "100% safe transactions",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg backdrop-blur-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-violet-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "24/7", label: "Support" },
            { value: "100%", label: "Responsive" },
            { value: "Free", label: "Signup" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm"
            >
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-violet-300">{stat.label}</p>
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
            <h2 className="text-3xl font-black text-white">Create account</h2>
            <p className="mt-2 text-slate-400">
              Join ShopSphere and start shopping today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

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
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-2 text-xs text-slate-500">
                Must contain uppercase, number & special character
              </p>
            </div>

            {/* Error */}
            {(clientError || error) && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <span className="mt-0.5 text-red-400">⚠️</span>
                <p className="text-sm font-medium text-red-400">
                  {clientError || error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-linear-to-r from-violet-600 via-indigo-600 to-violet-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:via-indigo-500 hover:to-violet-500 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                  Creating Account...
                </span>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-violet-400 transition hover:text-violet-300 hover:underline"
            >
              Sign In →
            </Link>
          </p>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: "🎁", label: "Free Signup" },
              { icon: "🔒", label: "100% Secure" },
              { icon: "🚀", label: "Instant Access" },
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

export default SignupPage;

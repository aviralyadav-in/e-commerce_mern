import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  loginAdmin,
  clearAuthError,
  checkAuth,
} from "../features/auth/authSlice";
import {
  AlertIcon,
  BagIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
} from "../components/common/Icon";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, authChecked } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
    }
  }, [authChecked, dispatch]);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, authChecked, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    dispatch(loginAdmin({ email: email.trim(), password }));
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <p className="text-xs font-medium text-slate-400 tracking-wider uppercase">
            Loading Console…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-150 h-150 rounded-full opacity-30 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-150 h-150 rounded-full opacity-25 blur-[130px]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-112.5 h-112.5 rounded-full opacity-15 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)",
          }}
        />
        {/* Subtle Grid Matrix */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-110 relative z-10">
        {/* Main Glassmorphism Card */}
        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(99,102,241,0.12)] p-7 sm:p-9 transition-all duration-300 ring-1 ring-white/10">
          {/* Subtle Top Glowing Border Accent */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-indigo-500/60 to-transparent rounded-t-3xl" />

          {/* Header & Branding */}
          <div className="flex items-center gap-4 mb-7">
            <div className="w-13 h-13 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30 ring-1 ring-white/25">
              <BagIcon className="w-6.5 h-6.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-black tracking-tight text-white leading-none">
                  Niya Bags
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ADMIN
                </span>
              </div>
              <p className="text-[12px] text-slate-400 mt-1.5 font-medium tracking-wide">
                Enterprise Commerce Console
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-[17px] font-bold text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-[13px] text-slate-400 mt-1">
              Please enter your administrator credentials to continue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-[13px] leading-relaxed shadow-xs animate-shake">
              <AlertIcon className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-5 select-text">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[12px] font-semibold tracking-wider uppercase text-slate-300 mb-2"
              >
                Admin Email <span className="text-indigo-400">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <MailIcon className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@niyabags.com"
                  className="w-full pl-10.5 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[14px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[12px] font-semibold tracking-wider uppercase text-slate-300 mb-2"
              >
                Password <span className="text-indigo-400">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <LockIcon className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10.5 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[14px] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 shadow-inner font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4.5 h-4.5" />
                  ) : (
                    <EyeIcon className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-5 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white font-bold text-[14px] tracking-wide shadow-lg shadow-indigo-600/35 hover:shadow-indigo-600/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                  <span>Verifying Credentials…</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>

        {/* Security / System Footer Note */}
        <div className="flex items-center justify-center gap-2 text-[12px] text-slate-400 font-medium mt-6">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Protected Enterprise Session · Niya Bags Cloud</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

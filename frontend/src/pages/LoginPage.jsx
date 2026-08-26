import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  loginAdmin,
  clearAuthError,
  checkAuth,
} from "../features/auth/authSlice";
import { Field } from "../components/common/Field";
import { AlertIcon, BagIcon, EyeIcon } from "../components/common/Icon";

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
    dispatch(loginAdmin({ email, password }));
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-(--ink) flex items-center justify-center">
        <span className="spinner w-8 h-8 border-[3px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--ink) flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(234,88,12,0.35), transparent), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(14,165,233,0.2), transparent)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="w-full max-w-100 relative z-10">
        <div className="bg-white rounded-lg shadow-2xl shadow-black/40 border-t-[3px] border-(--brand) p-7 sm:p-8">
          <div className="flex items-center gap-2.5 mb-7">
            <span className="w-10 h-10 rounded-(--radius) bg-(--brand) text-white flex items-center justify-center shrink-0">
              <BagIcon className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-display text-[19px] font-bold text-(--ink) tracking-[-0.015em] leading-none">
                Bag Store
              </h1>
              <p className="text-[11.5px] text-(--ink-muted) mt-1">
                Admin panel
              </p>
            </div>
          </div>

          <h2 className="text-[15px] font-bold text-(--ink)">
            Sign in to continue
          </h2>
          <p className="text-[12.5px] text-(--ink-muted) mt-1 mb-5">
            Use the admin credentials issued for this store.
          </p>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 mb-4 rounded-(--radius) bg-red-50 border border-red-200">
              <AlertIcon className="w-4 h-4 text-(--danger) shrink-0 mt-px" />
              <p className="text-[12.5px] text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email address" required htmlFor="login-email">
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter email"
                className="form-input form-input-lg"
              />
            </Field>

            <Field label="Password" required htmlFor="login-password">
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input form-input-lg"
                  /* .form-input-lg sets padding unlayered, so Tailwind's pr-* would lose. */
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 icon-btn icon-btn-ghost"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-1"
            >
              {loading && <span className="spinner spinner-on-brand" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11.5px] text-white/45 mt-5">
          Bag Store admin · authorised staff only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

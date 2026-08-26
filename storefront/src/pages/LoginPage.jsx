import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearAuthError } from "../features/auth/authSlice";
import { pushToast } from "../features/ui/uiSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const redirectTo = location.state?.from || "/";

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      dispatch(pushToast(`Welcome back, ${result.payload.name}!`));
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
      <div className="text-center">
        <p className="eyebrow mb-3">Welcome Back</p>
        <h1 className="font-display text-4xl font-medium">Sign In</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Access your bag, wishlist & orders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
        {error && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: "rgba(229,101,94,0.1)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}
        <div>
          <label className="field-label">Email</label>
          <input
            className="field"
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            className="field"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn btn-accent w-full" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <p className="text-center text-sm" style={{ color: "var(--ink-muted)" }}>
          New to Niya Bags?{" "}
          <Link to="/signup" className="font-semibold" style={{ color: "var(--accent)" }}>
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

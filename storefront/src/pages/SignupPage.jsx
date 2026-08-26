import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { signupUser, clearAuthError } from "../features/auth/authSlice";
import { pushToast } from "../features/ui/uiSlice";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    dateOfBirth: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // DOB ko ISO string me bhejo (backend z.coerce.date() handle karta hai)
    const payload = {
      ...form,
      dateOfBirth: form.dateOfBirth || null,
    };
    const result = await dispatch(signupUser(payload));
    if (signupUser.fulfilled.match(result)) {
      dispatch(pushToast(`Welcome to Niya Bags, ${result.payload.name}!`));
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-lg flex-col justify-center px-4 py-8 sm:px-6">
      <div className="text-center">
        <p className="eyebrow mb-2">Join Us</p>
        <h1 className="font-display text-3xl font-medium sm:text-4xl">
          Create Account
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
          Create your account and discover effortless luxury.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-5 sm:p-6">
        {error && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: "rgba(229,101,94,0.1)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <div>
          <label className="field-label">Full Name</label>
          <input
            className="field"
            required
            minLength={2}
            maxLength={50}
            placeholder="Aarav Sharma"
            value={form.name}
            onChange={set("name")}
          />
        </div>

        {/* Email + Phone side-by-side */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Email Address</label>
            <input
              className="field"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div>
            <label className="field-label">Phone Number</label>
            <input
              className="field"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              pattern="[6-9][0-9]{9}"
              title="Valid Indian mobile number (10 digits, starts with 6-9)"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
        </div>

        {/* Gender + DOB side-by-side */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Gender</label>
            <select
              className="field"
              value={form.gender}
              onChange={set("gender")}
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Date of Birth</label>
            <input
              className="field"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={form.dateOfBirth}
              onChange={set("dateOfBirth")}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Password</label>
          <input
            className="field"
            type="password"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={set("password")}
          />
        </div>

        <button className="btn btn-accent w-full" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
        <p className="text-center text-sm" style={{ color: "var(--ink-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

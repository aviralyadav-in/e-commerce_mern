import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import { useWishlistStore } from "../../stores/wishlistStore";
import FormField from "../../components/common/FormField";
import { Spinner } from "../../components/common/PageLoader";
import usePageTitle from "../../hooks/usePageTitle";
import AuthShell, { AuthErrorBanner, PasswordInput } from "./auth-AuthShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "/login" or "/login?redirect=…" — same link logic as before. */
const withRedirect = (path, redirectUrl) =>
  `${path}${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`;

const SIGNUP_QUOTE = {
  text: "Express checkout, a saved wishlist and a concierge who actually answers. It feels like having a personal shopper.",
  author: "Rhea K.",
  meta: "Member since 2025 · Mumbai",
};

export default function SignupPage() {
  usePageTitle("Create account");

  // Same payload shape the store has always sent (gender is a silent default).
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "female",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuthStore();
  const { getCart } = useCartStore();
  const { getWishlist } = useWishlistStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const setField = (name) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Same rules as before: name, email, password required; password >= 6 chars.
    const errors = {};
    if (!formData.name) errors.name = "Enter your full name.";
    if (!formData.email) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(formData.email)) errors.email = "Enter a valid email address.";
    if (!formData.password) errors.password = "Choose a password.";
    else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters long.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setLoading(true);
      const res = await signup(formData);
      if (res.success) {
        await Promise.all([getCart(), getWishlist()]);
        navigate(redirectUrl);
      } else {
        setFormError(res.message || "Registration failed");
      }
    } catch {
      setFormError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join the circle"
      title="Create your account"
      description="Early capsule previews, express checkout and concierge support, reserved for members."
      quote={SIGNUP_QUOTE}
      image="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1400&auto=format&fit=crop"
      footer={
        <>
          <p>
            Already a member?{" "}
            <Link to={withRedirect("/login", redirectUrl)} className="link-gold font-semibold">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            By creating an account you agree to our{" "}
            <Link to="/contact" className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/contact" className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      }
    >
      <AuthErrorBanner message={formError} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Full name" required error={fieldErrors.name}>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={formData.name}
            onChange={setField("name")}
            placeholder="Eleanor Vance"
            className="input-luxury"
          />
        </FormField>

        <FormField label="Email address" required error={fieldErrors.email}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={formData.email}
            onChange={setField("email")}
            placeholder="you@example.com"
            className="input-luxury"
          />
        </FormField>

        <FormField label="Password" required error={fieldErrors.password} hint="At least 6 characters.">
          <PasswordInput
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={formData.password}
            onChange={setField("password")}
            placeholder="Create a password"
          />
        </FormField>

        <FormField label="Mobile number" error={fieldErrors.phone} hint="For delivery updates only.">
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            value={formData.phone}
            onChange={setField("phone")}
            placeholder="e.g. 9876543210"
            className="input-luxury"
          />
        </FormField>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn btn-primary btn-lg btn-block btn-luxury mt-2"
        >
          {loading && <Spinner className="size-4" />}
          <span>Create account</span>
        </button>
      </form>
    </AuthShell>
  );
}

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

/** "/signup" or "/signup?redirect=…" — same link logic as before. */
const withRedirect = (path, redirectUrl) =>
  `${path}${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`;

export default function LoginPage() {
  usePageTitle("Sign in");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { getCart } = useCartStore();
  const { getWishlist } = useWishlistStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const clearFieldError = (name) => {
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Same rules as before (both fields required); presented inline instead of a banner.
    const errors = {};
    if (!email) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setLoading(true);
      const res = await login({ email, password });
      if (res.success) {
        // Refresh cart & wishlist after login
        await Promise.all([getCart(), getWishlist()]);
        navigate(redirectUrl);
      } else {
        setFormError(res.message || "Invalid credentials");
      }
    } catch {
      setFormError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Client portal"
      title="Welcome back"
      description="Sign in to view your orders, saved addresses and private wishlist."
      footer={
        <>
          <p>
            New here?{" "}
            <Link to={withRedirect("/signup", redirectUrl)} className="link-gold font-semibold">
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            By signing in you agree to our{" "}
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
        <FormField label="Email address" required error={fieldErrors.email}>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            placeholder="you@example.com"
            className="input-luxury"
          />
        </FormField>

        <FormField label="Password" required error={fieldErrors.password}>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            placeholder="Your password"
          />
        </FormField>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn btn-primary btn-lg btn-block btn-luxury mt-2"
        >
          {loading && <Spinner className="size-4" />}
          <span>Sign in</span>
        </button>
      </form>
    </AuthShell>
  );
}

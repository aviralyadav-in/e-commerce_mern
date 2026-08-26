import { Navigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { SpinnerIcon } from "./Icons";

/**
 * Storefront protected route — login na hone par /login pe redirect,
 * jaha se login karne ke baad wapas isi page pe aa sake.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-32">
        <SpinnerIcon size={28} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return children;
}

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, isLoading } = useSelector(
    (state) => state.auth,
  );

  const handleLogout = async () => {
    const resultAction = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(resultAction)) {
      navigate("/", { replace: true });
    }
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors duration-200 ${
      isActive ? "text-indigo-400" : "text-slate-300 hover:text-white"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="text-2xl font-black tracking-tight"
          >
            <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              ShopSphere
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>

            {!isAuthenticated && (
              <>
                <NavLink to="/signup" className={navLinkClass}>
                  Signup
                </NavLink>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
              </>
            )}

            {isAuthenticated && (
              <>
                {user?.role === "admin" ? (
                  <NavLink to="/admin/dashboard" className={navLinkClass}>
                    Admin Panel
                  </NavLink>
                ) : null}
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
                <NavLink to="/cart" className={navLinkClass}>
                  Cart
                </NavLink>
              </>
            )}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <div className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2">
                  <p className="text-sm font-semibold text-indigo-300">
                    👋 Hi, {user?.name} {user?.role === "admin" ? "(Admin)" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleLogout}
                  className="rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 transition hover:bg-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-slate-300 transition-all duration-300 ${
                mobileMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-slate-300 transition-all duration-300 ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-slate-300 transition-all duration-300 ${
                mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden border-t border-slate-700/50 bg-slate-900/98 transition-all duration-300 md:hidden ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1 px-4 py-4">
            {/* User greeting on mobile */}
            {isAuthenticated && (
              <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
                <p className="text-sm font-semibold text-indigo-300">
                  👋 Hi, {user?.name}
                </p>
              </div>
            )}

            {/* Mobile Nav Links */}
            <NavLink
              to="/"
              end
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              🏠 Home
            </NavLink>

            {!isAuthenticated && (
              <>
                <NavLink
                  to="/signup"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-violet-500/10 text-violet-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  📝 Signup
                </NavLink>
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  🔐 Login
                </NavLink>
              </>
            )}

            {isAuthenticated && (
              <>
                {user?.role === "admin" ? (
                  <NavLink
                    to="/admin/dashboard"
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    🧑‍💼 Admin Panel
                  </NavLink>
                ) : null}
                <NavLink
                  to="/profile"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  👤 Profile
                </NavLink>
                <NavLink
                  to="/cart"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-violet-500/10 text-violet-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  🛒 Cart
                </NavLink>
              </>
            )}

            {/* Mobile Auth Button */}
            <div className="pt-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {isLoading ? "Logging out..." : "🚪 Logout"}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block w-full rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
                >
                  Get Started →
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;

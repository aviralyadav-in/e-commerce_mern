import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setPaletteOpen, toggleTheme } from "../../features/ui/uiSlice";
import { logoutAdmin } from "../../features/auth/authSlice";
import ConfirmDialog from "../common/ConfirmDialog";
import { initials } from "../../utils/format";
import {
  MenuIcon,
  SearchIcon,
  ChevronDownIcon,
  UserIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
} from "../common/Icon";

const pageMeta = {
  "/dashboard": { title: "Dashboard", crumb: "Overview" },
  "/users": { title: "Customers", crumb: "Customers" },
  "/categories": { title: "Categories", crumb: "Catalog" },
  "/products": { title: "Products", crumb: "Catalog" },
  "/orders": { title: "Orders", crumb: "Sales" },
  "/banners": { title: "Banners", crumb: "Catalog" },
  "/coupons": { title: "Coupons", crumb: "Sales" },
  "/wishlists": { title: "Wishlists", crumb: "Customers" },
  "/carts": { title: "Carts", crumb: "Customers" },
  "/reviews": { title: "Reviews", crumb: "Sales" },
};

const Navbar = ({ isOpen, setIsOpen, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const meta = pageMeta[location.pathname] || pageMeta["/dashboard"];

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const confirmLogout = () => {
    setLoggingOut(true);
    dispatch(logoutAdmin()).finally(() => {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
      navigate("/login");
    });
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      if (onToggleCollapse) onToggleCollapse();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <header className="topbar sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleToggleSidebar}
          className="icon-btn icon-btn-ghost text-slate-600 hover:text-slate-900 cursor-pointer transition-transform hover:scale-105"
          aria-label="Toggle sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <nav className="crumb" aria-label="Breadcrumb">
          <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-[11px] uppercase tracking-wider">
            {meta.crumb}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
          <span className="crumb-current text-[13px]">{meta.title}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Store Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Store Live</span>
        </div>

        {/* Global Search trigger */}
        <button
          onClick={() => dispatch(setPaletteOpen(true))}
          className="topbar-search group"
          aria-label="Search pages"
        >
          <SearchIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="hidden sm:inline text-slate-400 group-hover:text-slate-600">Quick search…</span>
          <span className="hidden sm:flex items-center gap-1 ml-auto">
            <span className="kbd">Ctrl</span>
            <span className="kbd">K</span>
          </span>
        </button>

        {/* Dark / Light Mode Switcher */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-amber-300 hover:text-indigo-600 dark:hover:text-amber-200 transition-all hover:scale-105 cursor-pointer shadow-xs"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <SunIcon className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <MoonIcon className="w-4.5 h-4.5 text-slate-600" />
          )}
        </button>

        {/* Admin Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="avatar w-8 h-8 text-[12px]">
              {initials(admin?.name) || "A"}
            </div>
            <div className="hidden md:block text-left leading-tight pr-0.5">
              <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                {admin?.name || "Admin"}
              </p>
              <p className="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-semibold">Super Admin</p>
            </div>
            <ChevronDownIcon className="hidden md:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="menu-pop" role="menu">
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1 bg-slate-50/70 dark:bg-slate-900/70 rounded-t-lg">
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
                  {admin?.name || "Admin"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {admin?.email || "admin@bagstore.com"}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  Authorized Administrator
                </span>
              </div>

              <button
                onClick={() => dispatch(toggleTheme())}
                className="menu-item justify-between"
                role="menuitem"
              >
                <div className="flex items-center gap-2.5">
                  {theme === "dark" ? (
                    <SunIcon className="w-4 h-4 text-amber-400" />
                  ) : (
                    <MoonIcon className="w-4 h-4 text-indigo-500" />
                  )}
                  <span>{theme === "dark" ? "Switch to Light" : "Switch to Dark"}</span>
                </div>
                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 capitalize">
                  {theme}
                </span>
              </button>

              <div className="menu-item" role="menuitem">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Super Admin Account</span>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="menu-item menu-item-danger"
                role="menuitem"
              >
                <LogoutIcon className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out?"
        message="You will need to sign in again to access the admin panel."
        confirmLabel="Log out"
        variant="danger"
        busy={loggingOut}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
};

export default Navbar;

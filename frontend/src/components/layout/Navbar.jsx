import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setPaletteOpen } from "../../features/ui/uiSlice";
import { logoutAdmin } from "../../features/auth/authSlice";
import ConfirmDialog from "../common/ConfirmDialog";
import { initials } from "../../utils/format";
import {
  MenuIcon,
  SearchIcon,
  ChevronDownIcon,
  UserIcon,
  LogoutIcon,
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

const Navbar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { admin } = useSelector((state) => state.auth);
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

  return (
    <header className="topbar sticky top-0 z-10">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden icon-btn icon-btn-ghost"
          aria-label="Toggle menu"
        >
          <MenuIcon className="w-4.5 h-4.5" />
        </button>

        <nav className="crumb" aria-label="Breadcrumb">
          <span className="hidden sm:inline">{meta.crumb}</span>
          <span className="hidden sm:inline text-(--border-strong)">/</span>
          <span className="crumb-current">{meta.title}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(setPaletteOpen(true))}
          className="topbar-search"
          aria-label="Search pages"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search…</span>
          <span className="hidden sm:flex items-center gap-0.5 ml-auto">
            <span className="kbd">Ctrl</span>
            <span className="kbd">K</span>
          </span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-(--radius) hover:bg-(--surface-sunken) transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="avatar w-7 h-7 text-[11px]">
              {initials(admin?.name) || "A"}
            </div>
            <div className="hidden md:block text-left leading-tight pr-0.5">
              <p className="text-[12px] font-semibold text-(--ink)">
                {admin?.name || "Admin"}
              </p>
              <p className="text-[10px] text-(--ink-faint)">Super Admin</p>
            </div>
            <ChevronDownIcon className="hidden md:block w-3.5 h-3.5 text-(--ink-faint)" />
          </button>

          {menuOpen && (
            <div className="menu-pop" role="menu">
              <div className="px-2.5 py-2 border-b border-(--border) mb-1">
                <p className="text-[12.5px] font-semibold text-(--ink) truncate">
                  {admin?.name || "Admin"}
                </p>
                <p className="text-[11px] text-(--ink-muted) truncate">
                  {admin?.email || "admin@bagstore.com"}
                </p>
              </div>
              <div className="menu-item" role="menuitem">
                <UserIcon className="w-4 h-4 text-(--ink-faint)" />
                <span>Signed in as Super Admin</span>
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

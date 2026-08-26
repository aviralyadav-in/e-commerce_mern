import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useDispatch, useSelector } from "react-redux";
import {
  toggleTheme,
  openSearch,
  openCart,
  pushToast,
} from "../../features/ui/uiSlice";
import { logoutUser } from "../../features/auth/authSlice";
import {
  SunIcon,
  MoonIcon,
  SearchIcon,
  HeartIcon,
  UserIcon,
  BagIcon,
  PackageIcon,
  LogoutIcon,
} from "../common/Icons";
import AnnouncementBar from "./AnnouncementBar";

const NAV_LINKS = [
  { label: "Shop All", to: "/shop" },
  { label: "New Arrivals", to: "/shop?collection=new" },
  { label: "Bestsellers", to: "/shop?collection=best" },
  { label: "Sale", to: "/sale" },
];


function AccountMenu() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await dispatch(logoutUser());
    dispatch(pushToast("Logged out successfully", "info"));
    navigate("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="icon-btn"
        aria-label="Account"
        onClick={() => setOpen((v) => !v)}
      >
        <UserIcon size={19} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-11 w-52 rounded-xl p-2"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-pop)",
          }}
        >
          {user ? (
            <>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {user.email}
                </p>
              </div>
              <div
                className="my-1"
                style={{ borderTop: "1px solid var(--border)" }}
              />
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <UserIcon size={15} /> My Profile
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <PackageIcon size={15} /> My Orders
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <HeartIcon size={15} /> Wishlist
              </Link>
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                onClick={handleLogout}
                style={{ color: "var(--danger)" }}
              >
                <LogoutIcon size={15} /> Logout
              </button>
            </>
          ) : (
            <div className="p-2">
              <p
                className="mb-3 px-1 text-sm"
                style={{ color: "var(--ink-muted)" }}
              >
                Login to access your bag, orders & wishlist.
              </p>
              <Link
                to="/login"
                className="btn btn-accent w-full py-2.5! text-[11px]!"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <p
                className="mt-2 text-center text-xs"
                style={{ color: "var(--ink-muted)" }}
              >
                New here?{" "}
                <Link
                  to="/signup"
                  className="font-semibold underline"
                  style={{ color: "var(--accent)" }}
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default function Header() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  const cartCount = useSelector(
    (state) => state.cart.cart?.items?.reduce((n, i) => n + i.quantity, 0) || 0,
  );
  const wishlistCount = useSelector((state) => state.wishlist.products.length);

  return (
    <>
      {/* Rotating announcements — scroll karke gayab ho jata hai */}
      <AnnouncementBar />
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--bg-deep)",
          borderBottom: "1px solid var(--border)",
        }}
      >

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="mr-2 shrink-0">
          <span
            className="font-display text-[22px] font-semibold tracking-wide"
            style={{ color: "var(--ink)" }}
          >
            Niya Bags
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--ink-soft)")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            className="icon-btn"
            aria-label="Search"
            onClick={() => dispatch(openSearch())}
          >
            <SearchIcon size={19} />
          </button>
          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
            <HeartIcon size={19} />
            {wishlistCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: "var(--accent)", color: "#101d1d" }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>
          <AccountMenu />
          <button
            className="icon-btn"
            aria-label="Toggle theme"
            onClick={() => dispatch(toggleTheme())}
          >
            {theme === "dark" ? <SunIcon size={19} /> : <MoonIcon size={19} />}
          </button>
          <button
            className="icon-btn"
            aria-label="Bag"
            onClick={() => dispatch(openCart())}
          >
            <BagIcon size={19} />
            {cartCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: "var(--accent)", color: "#101d1d" }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Compact mobile nav — hamburger ke bina links yahin dikhte hain */}
      <nav
        className="flex gap-5 overflow-x-auto px-4 pb-2.5 sm:px-6 md:hidden"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="shrink-0 whitespace-nowrap py-2.5 text-xs font-medium"
            style={{ color: "var(--ink-soft)" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      </header>
    </>
  );
}

import React from "react";
import { useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";

// Har route ka title define kiya hai
const pageTitles = {
  "/dashboard": "Dashboard",
  "/users": "Users Management",
  "/categories": "Categories Management",
  "/products": "Products Management",
  "/orders": "Orders Management",
  "/banners": "Banners Management",
  "/coupons": "Coupons Management",
};

const Navbar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);

  // Current page ka title nikalo
  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  // Logout Handler
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Left Side - Hamburger + Page Title */}
      <div className="flex items-center gap-4">
        {/* Hamburger Button - Sirf Mobile Me Dikhega */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          {/* Hamburger Icon */}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Page Title */}
        <div>
          <h2 className="text-lg font-bold text-gray-800">{currentTitle}</h2>
          <p className="text-xs text-gray-400 hidden sm:block">
            Welcome back, {admin?.name || "Admin"} 👋
          </p>
        </div>
      </div>

      {/* Right Side - Notification + Admin Info */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {/* Notification Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

        {/* Admin Info + Avatar */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {admin?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-400">{admin?.email || ""}</p>
          </div>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer">
            <span className="text-white font-bold text-sm">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
        </div>

        {/* Mobile Me Sirf Avatar Dikhega */}
        <div className="sm:hidden">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
        </div>

        {/* Logout Button - Sirf Desktop Me */}
        <button
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;

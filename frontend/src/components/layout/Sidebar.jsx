import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../../features/auth/authSlice";
import ConfirmDialog from "../common/ConfirmDialog";
import { initials } from "../../utils/format";
import {
  HomeIcon,
  GridIcon,
  BagIcon,
  ImageIcon,
  ClipboardIcon,
  TagIcon,
  StarIcon,
  UsersIcon,
  HeartIcon,
  CartIcon,
  LogoutIcon,
  XIcon,
  ChevronsLeftIcon,
} from "../common/Icon";

export const NAV_GROUPS = [
  {
    title: "Overview",
    links: [{ path: "/dashboard", label: "Dashboard", Icon: HomeIcon }],
  },
  {
    title: "Catalog",
    links: [
      { path: "/categories", label: "Categories", Icon: GridIcon },
      { path: "/products", label: "Products", Icon: BagIcon },
      { path: "/banners", label: "Banners", Icon: ImageIcon },
    ],
  },
  {
    title: "Sales",
    links: [
      {
        path: "/orders",
        label: "Orders",
        Icon: ClipboardIcon,
        badge: "openOrders",
      },
      { path: "/coupons", label: "Coupons", Icon: TagIcon },
      { path: "/reviews", label: "Reviews", Icon: StarIcon },
    ],
  },
  {
    title: "Customers",
    links: [
      { path: "/users", label: "Customers", Icon: UsersIcon },
      { path: "/wishlists", label: "Wishlists", Icon: HeartIcon },
      { path: "/carts", label: "Carts", Icon: CartIcon },
    ],
  },
];

const Sidebar = ({ isOpen, setIsOpen, collapsed, onToggleCollapse }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);
  const orders = useSelector((state) => state.orders.orders);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const badges = {
    openOrders: orders.filter(
      (o) => o.orderStatus === "Pending" || o.orderStatus === "Processing",
    ).length,
  };

  const confirmLogout = () => {
    setLoggingOut(true);
    dispatch(logoutAdmin()).finally(() => {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
      navigate("/login");
    });
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/45 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar fixed top-0 left-0 h-full z-30 transform transition-all duration-200 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{
          width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        }}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="w-6.5 h-6.5 rounded-lg bg-(--brand) flex items-center justify-center shrink-0">
            <BagIcon className="w-3.75 h-3.75 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-white truncate leading-tight">
                Bag Store
              </p>
              <p className="text-[9.5px] text-(--sidebar-muted) uppercase tracking-widest leading-tight">
                Admin
              </p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-(--sidebar-muted) hover:text-white p-1 shrink-0"
            aria-label="Close menu"
          >
            <XIcon className="w-4 h-4" />
          </button>
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex text-(--sidebar-muted) hover:text-white p-1 shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronsLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={`flex-1 overflow-y-auto sidebar-scroll py-3 space-y-3.5 ${
            collapsed ? "px-2.5" : "px-3"
          }`}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {collapsed ? (
                <div className="h-px bg-(--sidebar-border) mx-1 mb-2" />
              ) : (
                <p className="nav-group-label">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.links.map(({ path, label, Icon, badge }) => {
                  const count = badge ? badges[badge] : 0;
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setIsOpen(false)}
                      title={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        `nav-link ${isActive ? "nav-link-active" : ""} ${
                          collapsed ? "justify-center px-0" : ""
                        }`
                      }
                    >
                      <Icon className="w-4.25 h-4.25 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{label}</span>
                          {count > 0 && (
                            <span className="nav-badge">{count}</span>
                          )}
                        </>
                      )}
                      {collapsed && count > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-(--brand)" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: admin identity + logout */}
        <div className="border-t border-(--sidebar-border) p-2.5 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={onToggleCollapse}
                className="nav-link justify-center px-0 w-full"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronsLeftIcon className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="nav-link justify-center px-0 w-full hover:bg-red-600! hover:text-white!"
                title="Log out"
                aria-label="Log out"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
                <div className="avatar w-7 h-7 text-[11px] bg-white/10! text-orange-200!">
                  {initials(admin?.name) || "A"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold text-white truncate leading-tight">
                    {admin?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-(--sidebar-muted) truncate leading-tight">
                    {admin?.email || "Signed in"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="nav-link w-full hover:bg-red-600! hover:text-white!"
              >
                <LogoutIcon className="w-4.25 h-4.25 shrink-0" />
                Log out
              </button>
            </>
          )}
        </div>
      </aside>

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
    </>
  );
};

export default Sidebar;

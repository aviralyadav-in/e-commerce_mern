import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../../features/auth/authSlice";
import ConfirmDialog from "../common/ConfirmDialog";
import { initials } from "../../utils/format";
import { BagIcon, LogoutIcon, XIcon, ChevronsLeftIcon, StoreIcon, ExternalLinkIcon } from "../common/Icon";
import { getStorefrontUrl } from "../../utils/storefrontUrl";
import { NAV_GROUPS } from "./navGroups";

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
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar fixed top-0 left-0 h-full z-50 transform transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto`}
        style={{
          width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
        }}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer hover:opacity-90 transition-opacity"
            title="Go to Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <BagIcon className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 ml-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                    Niya Bags
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">
                  Admin Console
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Close menu"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav
          className={`flex-1 overflow-y-auto sidebar-scroll py-4 space-y-4 ${
            collapsed ? "px-2.5" : "px-3"
          }`}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {collapsed ? (
                <div className="h-px bg-slate-200/80 dark:bg-white/5 mx-1 my-2" />
              ) : (
                <p className="nav-group-label">{group.title}</p>
              )}
              <div className="space-y-1">
                {group.links.map(({ path, label, Icon, badge }) => {
                  const count = badge ? badges[badge] : 0;
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setIsOpen(false)}
                      title={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        `nav-link group ${isActive ? "nav-link-active" : ""} ${
                          collapsed ? "justify-center px-0" : ""
                        }`
                      }
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105" />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1 font-medium">
                            {label}
                          </span>
                          {count > 0 && (
                            <span className="nav-badge flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              {count}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && count > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Admin Identity + Logout */}
        <div className="border-t border-slate-200/80 dark:border-white/5 p-3 shrink-0 bg-slate-50/60 dark:bg-white/1 space-y-2">
          {/* Storefront Link */}
          {collapsed ? (
            <a
              href={getStorefrontUrl("/")}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link justify-center px-0 w-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50! dark:hover:bg-indigo-950/30!"
              title="View Live Storefront"
              aria-label="View Live Storefront"
            >
              <StoreIcon className="w-4 h-4" />
            </a>
          ) : (
            <a
              href={getStorefrontUrl("/")}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link flex items-center justify-between text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl px-3 py-2 text-xs font-semibold transition shadow-2xs group"
              title="Open Live Storefront in new tab"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate font-bold">View Storefront</span>
              </div>
              <ExternalLinkIcon className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>
          )}

          {collapsed ? (
            <div className="flex flex-col items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
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
                className="nav-link justify-center px-0 w-full hover:bg-red-50! dark:hover:bg-red-500/20! hover:text-red-600! dark:hover:text-red-400!"
                title="Log out"
                aria-label="Log out"
              >
                <LogoutIcon className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white dark:bg-white/3 border border-slate-200/80 dark:border-white/5 shadow-2xs">
                <div className="relative">
                  <div className="avatar w-8 h-8 text-[12px] bg-linear-to-tr from-indigo-500 to-violet-600 text-white font-bold">
                    {initials(admin?.name) || "A"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {admin?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5 font-medium">
                    {admin?.email || "admin@niyabags.com"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="nav-link w-full text-slate-600 dark:text-slate-400 hover:bg-red-50! dark:hover:bg-red-500/15! hover:text-red-600! dark:hover:text-red-300! transition-colors justify-start"
              >
                <LogoutIcon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                <span>Log out</span>
              </button>
            </div>
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

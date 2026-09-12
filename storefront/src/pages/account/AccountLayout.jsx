import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { User, Package, MapPin, Heart, LogOut, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { cn, formatDate, getImageUrl } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";
import PageLoader, { Spinner } from "../../components/common/PageLoader";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";

const NAV_ITEMS = [
  { label: "Profile", path: "/account", icon: User, description: "Details & photo" },
  { label: "Orders", path: "/account/orders", icon: Package, description: "Track & review" },
  { label: "Addresses", path: "/account/addresses", icon: MapPin, description: "Delivery book" },
  { label: "Wishlist", path: "/account/wishlist", icon: Heart, description: "Saved pieces" },
];

function isItemActive(item, pathname) {
  if (item.path === "/account") {
    return pathname === "/account" || pathname === "/account/profile";
  }
  return pathname.startsWith(item.path);
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AccountLayout() {
  const { user, authChecked, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      navigate("/login?redirect=" + encodeURIComponent(location.pathname));
    }
  }, [authChecked, user, location.pathname, navigate]);

  if (!user) {
    return <PageLoader label="Opening your account" minHeight="50vh" />;
  }

  const firstName = String(user.name || "").trim().split(/\s+/)[0] || "there";
  const memberSince = user.createdAt ? formatDate(user.createdAt, "long") : "";
  const avatarSrc = user.avatar ? getImageUrl(user.avatar) : undefined;

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    navigate("/");
  };

  return (
    <div className="container-x page-top section-tight">
      <PageHeader
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Account" }]}
        title="My account"
        description={`Welcome back, ${firstName}.`}
        size="compact"
      />

      {/* Mobile / tablet navigation: horizontal chip row */}
      <nav aria-label="Account sections" className="mb-6 lg:hidden">
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, location.pathname);
            return (
              <li key={item.path} className="shrink-0">
                <Link
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={cn("chip h-10", active && "chip-active")}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              className="chip h-10 text-danger hover:text-danger"
            >
              {signingOut ? <Spinner className="size-3.5" /> : <LogOut className="size-3.5" aria-hidden="true" />}
              <span>Sign out</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[280px_1fr] xl:gap-12">
        {/* Desktop sidebar */}
        <aside className="surface-card hidden p-5 lg:sticky lg:top-28 lg:block" aria-label="Account overview">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
              <AvatarFallback className="bg-primary font-serif text-lg font-semibold text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg font-semibold leading-tight text-foreground" title={user.name}>
                {user.name}
              </p>
              <p className="truncate text-small text-ink-muted" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
          {memberSince && (
            <p className="mt-4 flex items-center gap-2 text-small text-ink-soft">
              <span className="inline-block h-px w-5 bg-champagne" aria-hidden="true" />
              Member since {memberSince}
            </p>
          )}

          <nav aria-label="Account sections" className="hairline mt-5 pt-5">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item, location.pathname);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-r-xl border-l-2 py-2.5 pl-3 pr-2 text-small font-semibold transition-colors duration-300",
                        active
                          ? "border-champagne bg-surface-2 text-foreground"
                          : "border-transparent text-ink-muted hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active ? "bg-gold-soft text-gold-ink" : "bg-surface-2 text-ink-soft group-hover:text-gold-ink"
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span>{item.label}</span>
                        <span className="text-[11px] font-normal text-ink-soft">{item.description}</span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "size-4 shrink-0 transition-all duration-300",
                          active ? "text-gold-ink opacity-100" : "opacity-0 group-hover:opacity-60"
                        )}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hairline mt-5 pt-5">
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              className="btn btn-danger btn-sm btn-block"
            >
              {signingOut ? <Spinner className="size-4" /> : <LogOut aria-hidden="true" />}
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Section content */}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

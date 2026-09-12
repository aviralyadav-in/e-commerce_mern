import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from "lucide-react";
import AnnouncementBar from "./AnnouncementBar";
import SearchModal from "../common/SearchModal";
import MegaMenu from "../common/MegaMenu";
import ImageWithFallback from "../common/ImageWithFallback";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import { useWishlistStore } from "../../stores/wishlistStore";
import { api } from "../../lib/api";
import { cn, getImageUrl } from "../../lib/utils";
import { PRIMARY_LINKS, buildCategoryTree, flattenCategoryTree, getActiveNavKey } from "./nav-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

const MEGA_ID = "mega-menu";
const MEGA_TRIGGER_ID = "mega-menu-trigger";
const MEGA_OPEN_DELAY = 120;
const MEGA_CLOSE_DELAY = 220;

/* The logo gradient starts at onyx, so give it a token-based gold ramp in dark mode. */
const WORDMARK_GOLD =
  "gold-gradient-text dark:bg-linear-to-r dark:from-champagne-light dark:via-champagne dark:to-champagne-dark";

const ACCOUNT_LINKS = [
  { to: "/account", label: "My Profile", icon: User },
  { to: "/account/orders", label: "My Orders", icon: Package },
  { to: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
];

const isAdminUser = (user) =>
  Boolean(user && (user.role === "Admin" || user.role === "SuperAdmin" || user.isAdmin));

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:5174";

/**
 * Header: owns nav data + scroll state. The interactive shell (HeaderBar) is keyed
 * on the router location, so every navigation remounts it and any open overlay
 * (search, mobile sheet, mega menu, account menu) closes without state-sync effects.
 */
export default function Header() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  // Load categories & collections for the mega menu / mobile sheet
  useEffect(() => {
    let active = true;
    const fetchNavData = async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          api.get("/categories"),
          api.get("/collections"),
        ]);
        if (!active) return;
        setCategories(catRes.data?.categories || []);
        setCollections(colRes.data?.collections || []);
      } catch (err) {
        console.error("Header nav fetch error:", err);
      }
    };
    fetchNavData();
    return () => {
      active = false;
    };
  }, []);

  // Compact header once the page is scrolled (with hysteresis so it never flickers)
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY || 0;
      setScrolled((prev) => (prev ? y > 16 : y > 56));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <HeaderBar
      key={location.key}
      categories={categories}
      collections={collections}
      scrolled={scrolled}
    />
  );
}

function HeaderBar({ categories, collections, scrolled }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { openCart, getItemCount } = useCartStore();
  const { getCount } = useWishlistStore();
  const { theme, setTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);

  const megaTriggerRef = useRef(null);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const activeKey = getActiveNavKey(location);
  const cartItemCount = getItemCount();
  const wishlistCount = getCount();
  const categoryTree = buildCategoryTree(categories);
  const activeCollections = (Array.isArray(collections) ? collections : [])
    .filter((c) => c && c._id && c.isActive !== false)
    .slice(0, 5);

  /* ---- Mega menu open/close with small hover delays ---- */
  const clearMegaTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  };
  const openMega = (delay = 0) => {
    clearMegaTimers();
    openTimer.current = setTimeout(() => setIsMegaOpen(true), delay);
  };
  const closeMega = (delay = 0) => {
    clearMegaTimers();
    closeTimer.current = setTimeout(() => setIsMegaOpen(false), delay);
  };

  useEffect(() => clearMegaTimers, []);

  useEffect(() => {
    if (!isMegaOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMegaOpen(false);
        megaTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMegaOpen]);

  // Keyboard shortcut: "/" or Ctrl/Cmd+K opens search
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      // Never stack the search over an open dialog / drawer.
      if (document.querySelector('[role="dialog"]')) return;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleMegaBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) closeMega(0);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const userInitial = user?.name?.[0]?.toUpperCase() || "U";
  const primaryFirst = PRIMARY_LINKS[0];
  const primaryRest = PRIMARY_LINKS.slice(1);

  return (
    <>
      <header className="sticky top-0 z-40 w-full">
        <AnnouncementBar />

        <div
          className={cn(
            "relative transition-[background-color,border-color,box-shadow] duration-300",
            scrolled
              ? "surface-glass border-x-0 border-t-0 shadow-soft"
              : "border-b border-line bg-background/95"
          )}
        >
          <div
            className={cn(
              "container-x grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-300 ease-luxury lg:grid-cols-[auto_1fr_auto] xl:grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)]",
              scrolled ? "h-15" : "h-18"
            )}
          >
            {/* ---- Left: hamburger (mobile) / primary nav (desktop) ---- */}
            <div className="flex items-center justify-self-start">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="icon-btn -ml-2 lg:hidden"
                    aria-label="Toggle navigation menu"
                  >
                    <Menu className="size-5" aria-hidden="true" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  showCloseButton={false}
                  className="gap-0 border-line bg-background p-0 text-foreground shadow-lift data-[side=left]:w-[min(90vw,22rem)]"
                >
                  <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-line py-3 pl-5 pr-3">
                    <SheetTitle className="font-serif text-xl font-bold tracking-[0.2em] text-foreground">
                      NIYA <span className={WORDMARK_GOLD}>BAGS</span>
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Browse the collection, categories, collections and your account.
                    </SheetDescription>
                    <SheetClose asChild>
                      <button type="button" className="icon-btn size-11" aria-label="Close menu">
                        <X className="size-5" aria-hidden="true" />
                      </button>
                    </SheetClose>
                  </SheetHeader>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <nav aria-label="Mobile" className="px-3 py-3">
                      <ul className="space-y-0.5">
                        {PRIMARY_LINKS.map((link) => (
                          <li key={link.key}>
                            <Link
                              to={link.to}
                              aria-current={activeKey === link.key ? "page" : undefined}
                              className="flex min-h-12 items-center justify-between rounded-xl px-3 text-micro font-bold tracking-[0.18em] text-foreground transition-colors hover:bg-surface-2 aria-[current=page]:bg-surface-2 aria-[current=page]:text-gold-ink"
                            >
                              {link.label}
                              <ChevronRight className="size-4 text-ink-soft" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                      </ul>

                      {categoryTree.length > 0 && (
                        <section className="mt-5" aria-labelledby="mobile-nav-categories">
                          <p id="mobile-nav-categories" className="eyebrow px-3">
                            Shop by category
                          </p>
                          <ul className="mt-2 space-y-0.5">
                            {categoryTree.map((root) => {
                              const children = flattenCategoryTree(root.children);
                              return (
                                <li key={root._id}>
                                  <Link
                                    to={`/shop?categoryId=${root._id}`}
                                    className="flex min-h-11 items-center justify-between rounded-xl px-3 text-body font-semibold text-foreground transition-colors hover:bg-surface-2"
                                  >
                                    {root.name}
                                    <ChevronRight className="size-4 text-ink-soft" aria-hidden="true" />
                                  </Link>
                                  {children.length > 0 && (
                                    <ul className="mb-1 ml-4 border-l border-line pl-1">
                                      {children.map((cat) => (
                                        <li key={cat._id}>
                                          <Link
                                            to={`/shop?categoryId=${cat._id}`}
                                            className={cn(
                                              "flex min-h-11 items-center rounded-lg px-3 text-body text-foreground/85 transition-colors hover:bg-surface-2 hover:text-foreground",
                                              cat.depth > 1 && "pl-6 text-small text-ink-muted"
                                            )}
                                          >
                                            {cat.name}
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      )}

                      {activeCollections.length > 0 && (
                        <section className="mt-5" aria-labelledby="mobile-nav-collections">
                          <p id="mobile-nav-collections" className="eyebrow px-3">
                            Collections
                          </p>
                          <ul className="mt-2 space-y-0.5">
                            {activeCollections.map((col) => (
                              <li key={col._id}>
                                <Link
                                  to={`/shop?collections=${col._id}`}
                                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-surface-2"
                                >
                                  <ImageWithFallback
                                    src={col.image}
                                    alt=""
                                    ratio="1/1"
                                    className="size-9 shrink-0 rounded-lg"
                                  />
                                  <span className="truncate text-body font-medium text-foreground">
                                    {col.name}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </nav>

                    {/* ---- Account ---- */}
                    <div className="border-t border-line px-3 py-4">
                      {user ? (
                        <>
                          <div className="flex items-center gap-3 px-3 pb-3">
                            <Avatar className="size-10 ring-1 ring-line">
                              {user.avatar && <AvatarImage src={getImageUrl(user.avatar)} alt="" />}
                              <AvatarFallback className="bg-primary text-small font-bold text-primary-foreground">
                                {userInitial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-small font-bold text-foreground">{user.name}</p>
                              <p className="truncate text-small text-ink-muted">{user.email}</p>
                            </div>
                          </div>
                          <ul className="space-y-0.5">
                            {ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
                              <li key={to}>
                                <Link
                                  to={to}
                                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-body font-medium text-foreground transition-colors hover:bg-surface-2"
                                >
                                  <Icon className="size-4 text-gold-ink" aria-hidden="true" />
                                  <span className="flex-1">{label}</span>
                                  {to === "/account/wishlist" && wishlistCount > 0 && (
                                    <span className="pill pill-gold">{wishlistCount}</span>
                                  )}
                                </Link>
                              </li>
                            ))}
                            {isAdminUser(user) && (
                              <li>
                                <a
                                  href={ADMIN_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex min-h-11 items-center gap-3 rounded-xl bg-gold-soft px-3 text-body font-semibold text-gold-ink transition-colors hover:bg-surface-3"
                                >
                                  <span className="size-2 rounded-full bg-success animate-gold-pulse" aria-hidden="true" />
                                  <span className="flex-1">Admin Console</span>
                                  <ArrowUpRight className="size-4" aria-hidden="true" />
                                </a>
                              </li>
                            )}
                            <li>
                              <button
                                type="button"
                                onClick={handleLogout}
                                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-body font-medium text-danger transition-colors hover:bg-danger-soft"
                              >
                                <LogOut className="size-4" aria-hidden="true" />
                                Sign Out
                              </button>
                            </li>
                          </ul>
                        </>
                      ) : (
                        <div className="px-1">
                          <p className="px-2 pb-3 text-small text-ink-muted">
                            Sign in for faster checkout and saved pieces.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Link to="/login" className="btn btn-primary btn-sm btn-luxury">
                              Sign in
                            </Link>
                            <Link to="/signup" className="btn btn-secondary btn-sm">
                              Create account
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ---- Theme toggle ---- */}
                  <div className="border-t border-line p-3">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      aria-pressed={isDark}
                      className="flex min-h-12 w-full items-center justify-between rounded-xl border border-line bg-surface px-4 text-small font-semibold text-foreground transition-colors hover:bg-surface-2"
                    >
                      <span className="flex items-center gap-3">
                        <ThemeGlyph isDark={isDark} className="size-4" />
                        {isDark ? "Light mode" : "Dark mode"}
                      </span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative h-6 w-10 rounded-full transition-colors duration-300",
                          isDark ? "bg-champagne" : "bg-surface-3"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-5 rounded-full bg-surface shadow-soft transition-transform duration-300 ease-luxury",
                            isDark ? "translate-x-4.5" : "translate-x-0.5"
                          )}
                        />
                      </span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>

              <nav aria-label="Primary" className="hidden items-center gap-5 whitespace-nowrap lg:flex xl:gap-6">
                <Link
                  to={primaryFirst.to}
                  className="nav-link shrink-0"
                  aria-current={activeKey === primaryFirst.key ? "page" : undefined}
                >
                  {primaryFirst.label}
                </Link>

                <div
                  className="flex shrink-0 items-center"
                  onMouseEnter={() => openMega(MEGA_OPEN_DELAY)}
                  onMouseLeave={() => closeMega(MEGA_CLOSE_DELAY)}
                  onBlur={handleMegaBlur}
                >
                  <button
                    ref={megaTriggerRef}
                    id={MEGA_TRIGGER_ID}
                    type="button"
                    className={cn("nav-link inline-flex shrink-0 items-center gap-1.5", isMegaOpen && "text-gold-ink")}
                    aria-expanded={isMegaOpen}
                    aria-haspopup="true"
                    aria-controls={MEGA_ID}
                    onClick={() => (isMegaOpen ? closeMega(0) : openMega(0))}
                    onFocus={(e) => {
                      if (e.currentTarget.matches(":focus-visible")) openMega(0);
                    }}
                  >
                    Shop by Atelier
                    <ChevronDown
                      className={cn("size-3.5 transition-transform duration-300", isMegaOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  {isMegaOpen && (
                    <MegaMenu
                      id={MEGA_ID}
                      labelledBy={MEGA_TRIGGER_ID}
                      categories={categories}
                      collections={collections}
                      onNavigate={() => closeMega(0)}
                    />
                  )}
                </div>

                {primaryRest.map((link) => (
                  <Link
                    key={link.key}
                    to={link.to}
                    className="nav-link shrink-0"
                    aria-current={activeKey === link.key ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ---- Centre: wordmark ---- */}
            <Link
              to="/"
              className="flex flex-col items-center justify-self-center rounded-sm px-2 text-center"
            >
              <span
                className={cn(
                  "whitespace-nowrap font-serif font-bold leading-none tracking-[0.22em] text-foreground transition-[font-size] duration-300 ease-luxury",
                  scrolled ? "text-[1.3rem] sm:text-[1.45rem]" : "text-[1.4rem] sm:text-[1.6rem]"
                )}
              >
                NIYA <span className={WORDMARK_GOLD}>BAGS</span>
              </span>
              <span
                className={cn(
                  "hidden overflow-hidden text-[9px] font-semibold uppercase leading-3.5 tracking-[0.34em] text-ink-muted transition-all duration-300 ease-luxury sm:block",
                  scrolled ? "mt-0 max-h-0 opacity-0" : "mt-1 max-h-3.5 opacity-100"
                )}
              >
                Artisanal Leather
              </span>
            </Link>

            {/* ---- Right: icon cluster ---- */}
            <TooltipProvider delayDuration={400}>
              <div className="-mr-2 flex items-center justify-self-end gap-0.5 sm:gap-1">
                <HeaderIcon label="Search collection" tip="Search the atelier" onClick={() => setIsSearchOpen(true)}>
                  <Search className="size-5" aria-hidden="true" />
                </HeaderIcon>

                <HeaderIcon
                  label="Toggle theme"
                  tip={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={toggleTheme}
                  pressed={isDark}
                  className="hidden sm:inline-flex"
                >
                  <ThemeGlyph isDark={isDark} />
                </HeaderIcon>

                <HeaderIcon
                  to="/account/wishlist"
                  label="View wishlist"
                  tip="Wishlist"
                  count={wishlistCount}
                  countTone="gold"
                  className="hidden sm:inline-flex"
                >
                  <Heart className="size-5" aria-hidden="true" />
                </HeaderIcon>

                <HeaderIcon label="Open shopping bag" tip="Shopping bag" onClick={openCart} count={cartItemCount}>
                  <ShoppingBag className="size-5" aria-hidden="true" />
                </HeaderIcon>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="icon-btn hidden sm:inline-flex"
                      aria-label="Customer Account"
                    >
                      {user ? (
                        <Avatar className="size-7 ring-1 ring-line">
                          {user.avatar && <AvatarImage src={getImageUrl(user.avatar)} alt="" />}
                          <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User className="size-5" aria-hidden="true" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className="w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-lift ring-0"
                  >
                    {user ? (
                      <>
                        <DropdownMenuLabel className="px-3 py-2.5">
                          <p className="truncate text-small font-bold text-foreground">{user.name}</p>
                          <p className="truncate text-small font-normal text-ink-muted">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-line" />
                        {isAdminUser(user) && (
                          <>
                            <DropdownMenuItem asChild className={cn(menuItemClass, "bg-gold-soft font-semibold text-gold-ink focus:bg-surface-3 focus:text-gold-ink")}>
                              <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
                                <span className="size-2 shrink-0 rounded-full bg-success animate-gold-pulse" aria-hidden="true" />
                                <span className="flex-1">Admin Console</span>
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-line" />
                          </>
                        )}
                        {ACCOUNT_LINKS.map(({ to, label, icon: Icon }) => (
                          <DropdownMenuItem key={to} asChild className={menuItemClass}>
                            <Link to={to}>
                              <Icon className="size-4 text-gold-ink" aria-hidden="true" />
                              <span className="flex-1">{label}</span>
                              {to === "/account/wishlist" && wishlistCount > 0 && (
                                <span className="pill pill-gold">{wishlistCount}</span>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-line" />
                        <DropdownMenuItem variant="destructive" onClick={handleLogout} className={menuItemClass}>
                          <LogOut className="size-4" aria-hidden="true" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <div className="p-1.5">
                        <p className="text-small font-bold text-foreground">Welcome to Niya Bags</p>
                        <p className="mt-0.5 text-small text-ink-muted">
                          Sign in for faster checkout and saved pieces.
                        </p>
                        <div className="mt-3 space-y-2">
                          <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                            <Link to="/login" className="btn btn-primary btn-sm btn-block btn-luxury">
                              Sign In
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                            <Link to="/signup" className="btn btn-secondary btn-sm btn-block">
                              Create Account
                            </Link>
                          </DropdownMenuItem>
                        </div>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

const menuItemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-small font-medium text-foreground focus:bg-surface-2 focus:text-foreground data-[variant=destructive]:focus:bg-danger-soft";

/* Icon-only header action with tooltip and optional count badge. */
function HeaderIcon({ to, label, tip, onClick, count = 0, countTone = "onyx", className, pressed, children }) {
  const badge =
    count > 0 ? (
      <span
        className={cn(
          "absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none tabular-nums ring-2 ring-background",
          countTone === "gold" ? "bg-champagne text-onyx" : "bg-primary text-primary-foreground"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  const classes = cn("icon-btn relative", className);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {to ? (
          <Link to={to} aria-label={label} className={classes}>
            {children}
            {badge}
          </Link>
        ) : (
          <button type="button" onClick={onClick} aria-label={label} aria-pressed={pressed} className={classes}>
            {children}
            {badge}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{tip}</TooltipContent>
    </Tooltip>
  );
}

/* Sun/Moon cross-fade. Shows the icon of the mode you will switch to. */
function ThemeGlyph({ isDark, className }) {
  const base = "absolute inset-0 transition-all duration-500 ease-luxury";
  return (
    <span className={cn("relative block size-5", className)} aria-hidden="true">
      <Sun
        className={cn(base, "size-full", isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")}
      />
      <Moon
        className={cn(base, "size-full", isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")}
      />
    </span>
  );
}

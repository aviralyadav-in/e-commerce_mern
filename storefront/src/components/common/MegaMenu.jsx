import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn, clampText, formatCurrency } from "../../lib/utils";
import { buildCategoryTree, flattenCategoryTree } from "../layout/nav-data";

const FALLBACK_LINKS = [
  { label: "All bags", to: "/shop" },
  { label: "Women", to: "/shop?gender=Women" },
  { label: "Men", to: "/shop?gender=Men" },
  { label: "Private sale", to: "/shop?onSale=true" },
];

const MAX_ROOTS = 4;
const MAX_CHILDREN = 8;
const MAX_COLLECTIONS = 4;

/**
 * Full-width editorial panel under the header.
 * Props: categories (flat /categories payload), collections (/collections payload),
 * onNavigate (called on any link click so the parent can close the panel),
 * id / labelledBy for aria wiring with the trigger button.
 */
export default function MegaMenu({
  categories = [],
  collections = [],
  onNavigate,
  id = "mega-menu",
  labelledBy,
}) {
  const { settings, getFreeShippingThreshold } = useSettingsStore();
  const threshold = settings ? getFreeShippingThreshold() : 500;

  const roots = buildCategoryTree(categories).slice(0, MAX_ROOTS);
  const featuredCollections = (Array.isArray(collections) ? collections : [])
    .filter((c) => c && c._id && c.isActive !== false)
    .slice(0, MAX_COLLECTIONS);

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Shop by atelier"}
      className="absolute inset-x-0 top-full z-40 hidden lg:block"
    >
      <div className="surface-glass border-x-0 border-t-0 shadow-lift animate-fade-up [animation-duration:420ms]">
        <div className="container-x py-8 xl:py-10">
          <div className="grid grid-cols-12 gap-8 xl:gap-10">
            {/* ---- Categories grouped by root ---- */}
            <div className="col-span-5">
              {roots.length > 0 ? (
                <div className={cn("grid gap-6 xl:gap-8", roots.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                  {roots.map((root) => {
                    const children = flattenCategoryTree(root.children).slice(0, MAX_CHILDREN);
                    return (
                      <div key={root._id}>
                        <Link
                          to={`/shop?categoryId=${root._id}`}
                          onClick={onNavigate}
                          className="eyebrow inline-flex items-center gap-2 rounded-sm transition-colors hover:text-foreground"
                        >
                          <span className="h-px w-5 bg-champagne" aria-hidden="true" />
                          {root.name}
                        </Link>
                        <ul className="mt-4 space-y-0.5">
                          {children.map((cat) => (
                            <li key={cat._id}>
                              <Link
                                to={`/shop?categoryId=${cat._id}`}
                                onClick={onNavigate}
                                className={cn(
                                  "group/item flex items-center gap-1.5 rounded-md py-1.5 text-small font-medium text-foreground/90 transition-colors hover:text-gold-ink focus-visible:text-gold-ink",
                                  cat.depth > 1 && "pl-3 font-normal text-ink-muted"
                                )}
                              >
                                <span className="truncate">{cat.name}</span>
                                <ArrowUpRight
                                  className="size-3 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                                  aria-hidden="true"
                                />
                              </Link>
                            </li>
                          ))}
                          <li className="pt-2">
                            <Link
                              to={`/shop?categoryId=${root._id}`}
                              onClick={onNavigate}
                              className="link-gold text-small font-medium"
                            >
                              View all {String(root.name || "").toLowerCase()}
                            </Link>
                          </li>
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <p className="eyebrow inline-flex items-center gap-2">
                    <span className="h-px w-5 bg-champagne" aria-hidden="true" />
                    Shop
                  </p>
                  <ul className="mt-4 space-y-0.5">
                    {FALLBACK_LINKS.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          onClick={onNavigate}
                          className="flex items-center rounded-md py-1.5 text-small font-medium text-foreground/90 transition-colors hover:text-gold-ink"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ---- Collections with images ---- */}
            <div className="col-span-4 border-l border-line pl-6 xl:pl-10">
              <p className="eyebrow inline-flex items-center gap-2">
                <span className="h-px w-5 bg-champagne" aria-hidden="true" />
                Collections
              </p>
              {featuredCollections.length > 0 ? (
                <ul className="mt-4 space-y-1">
                  {featuredCollections.map((col) => (
                    <li key={col._id}>
                      <Link
                        to={`/shop?collections=${col._id}`}
                        onClick={onNavigate}
                        className="group/col -mx-2 flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-surface-2/80 focus-visible:bg-surface-2/80"
                      >
                        <ImageWithFallback
                          src={col.image}
                          alt=""
                          ratio="1/1"
                          className="size-14 shrink-0 rounded-xl"
                          imgClassName="transition-transform duration-700 ease-luxury group-hover/col:scale-105"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-serif text-base font-semibold text-foreground transition-colors group-hover/col:text-gold-ink">
                            {col.name}
                          </span>
                          <span className="hidden truncate text-small text-ink-muted xl:block">
                            {clampText(col.description, 64) || "Explore the edit"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-small text-ink-muted">
                  New edits are being curated in the atelier. Explore all bags meanwhile.
                </p>
              )}
            </div>

            {/* ---- Featured promo tile ---- */}
            <div className="col-span-3">
              <div className="surface-onyx relative flex h-full min-h-64 flex-col overflow-hidden rounded-2xl p-6">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-champagne/20 blur-3xl"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-champagne-dark/25 blur-3xl"
                />
                <span className="eyebrow relative text-champagne">Featured edit</span>
                <h3 className="relative mt-3 font-serif text-2xl font-semibold leading-tight text-ivory">
                  The Autumn Atelier Edit
                </h3>
                <p className="relative mt-2 text-small text-ivory/70">
                  Hand-finished silhouettes in cognac, oxblood and onyx. Limited numbers,
                  signed by the artisan.
                </p>
                <Link
                  to="/shop"
                  onClick={onNavigate}
                  className="btn btn-ivory btn-sm relative mt-6 self-start"
                >
                  <span>Shop the edit</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link
                  to="/shop?onSale=true"
                  onClick={onNavigate}
                  className="relative mt-4 inline-flex items-center gap-1 self-start text-micro text-champagne-light/80 transition-colors hover:text-champagne"
                >
                  Private sale
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* ---- Service strip ---- */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="flex items-center gap-2 text-micro text-ink-muted">
              <Sparkles className="size-3.5 text-gold-ink" aria-hidden="true" />
              <span>
                Complimentary express delivery over {formatCurrency(threshold)}
                <span className="mx-2 text-line-strong" aria-hidden="true">
                  ·
                </span>
                Code NIYA10 for 10% off your first order
              </span>
            </p>
            <Link to="/shop" onClick={onNavigate} className="nav-link inline-flex items-center gap-1.5">
              Shop all
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, History, Search, SearchX, X } from "lucide-react";
import { api } from "../../lib/api";
import { cn, getProductImages } from "../../lib/utils";
import ImageWithFallback from "./ImageWithFallback";
import PriceTag from "./PriceTag";
import EmptyState from "./EmptyState";
import { Spinner } from "./PageLoader";
import { SEARCH_SUGGESTIONS } from "../layout/nav-data";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

const RECENT_KEY = "niya_recent_searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 6;

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((t) => typeof t === "string" && t.trim()).slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function writeRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — keep in memory only
  }
}

/**
 * Search dialog. Props: isOpen, onClose.
 * All search state lives in <SearchPanel>, which Radix unmounts with the dialog,
 * so every open starts fresh without any state-reset effects.
 */
export default function SearchModal({ isOpen, onClose }) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[5vh] translate-y-0 gap-0 overflow-hidden rounded-2xl border border-line bg-background p-0 text-foreground shadow-lift ring-0 sm:top-[10vh] sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Search the collection</DialogTitle>
        <DialogDescription className="sr-only">
          Type to search handcrafted leather bags. Results update as you type.
        </DialogDescription>
        <SearchPanel onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function SearchPanel({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(readRecent);
  // The last completed request and the query it answered.
  const [result, setResult] = useState({ q: "", products: [], error: false });

  const q = query.trim();
  const settled = q !== "" && result.q === q;
  const loading = q !== "" && !settled;
  const products = settled ? result.products : [];
  const hasError = settled && result.error;
  // While a new query is pending, keep the previous list visible (dimmed) to avoid flicker.
  const stale = loading && result.q !== "" && result.products.length > 0;

  useEffect(() => {
    if (!q) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/products", {
          params: {
            search: q,
            limit: RESULT_LIMIT,
            isActive: "true",
          },
        });
        if (!cancelled) setResult({ q, products: res.data?.products || [], error: false });
      } catch (err) {
        console.error("Search query error:", err);
        if (!cancelled) setResult({ q, products: [], error: true });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  const remember = (term) => {
    const t = String(term || "").trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    writeRecent(next);
  };

  const forget = (term) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    writeRecent(next);
  };

  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

  const goToShop = (term) => {
    const t = String(term || "").trim();
    if (!t) return;
    remember(t);
    onClose();
    navigate(`/shop?search=${encodeURIComponent(t)}`);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToShop(query);
      return;
    }
    if (e.key === "ArrowDown") {
      const first = document.getElementById("search-results")?.querySelector("a[href]");
      if (first) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = Array.from(e.currentTarget.querySelectorAll("a[href]"));
    const i = links.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === "ArrowDown") {
      (links[i + 1] || links[0]).focus();
    } else if (i === 0) {
      inputRef.current?.focus();
    } else {
      links[i - 1].focus();
    }
  };

  const shownProducts = stale ? result.products : products;
  const showSkeleton = loading && !stale;
  const showEmpty = settled && !hasError && products.length === 0;

  return (
    <div className="flex max-h-[min(88vh,44rem)] min-w-0 flex-col">
      {/* ---- Search field ---- */}
      <div className="border-b border-line bg-surface px-3 pb-3 pt-3 sm:px-5 sm:pt-4">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search totes, slings, weekenders…"
              aria-label="Search products"
              aria-controls="search-results"
              className="input-luxury h-13 min-w-0 rounded-xl pl-12 pr-12 text-base sm:h-14 sm:text-lg"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
              {loading ? (
                <span className="inline-flex size-9 items-center justify-center" aria-hidden="true">
                  <Spinner className="size-4 text-gold-ink" />
                </span>
              ) : (
                query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="icon-btn size-9 text-ink-muted"
                    aria-label="Clear search"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )
              )}
            </div>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="h-13 shrink-0 rounded-xl px-3 text-micro text-ink-muted transition-colors hover:text-foreground sm:h-14"
            >
              Cancel
            </button>
          </DialogClose>
        </div>
        <p className="mt-2.5 hidden text-micro text-ink-soft sm:block">
          Enter to see all results &nbsp;·&nbsp; Esc to close
        </p>
      </div>

      {/* ---- Body ---- */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3 sm:py-3">
        <p role="status" aria-live="polite" className="sr-only">
          {loading
            ? "Searching the collection"
            : settled
              ? `${products.length} result${products.length === 1 ? "" : "s"} for ${q}`
              : ""}
        </p>

        {q === "" && (
          <div className="space-y-6 px-2 py-3 sm:px-3">
            {recent.length > 0 && (
              <section aria-label="Recent searches">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-micro text-ink-muted">
                    <History className="size-3.5" aria-hidden="true" />
                    Recent
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="rounded-sm text-micro text-ink-soft transition-colors hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <li key={term} className="chip h-10 cursor-default gap-0 pl-3.5 pr-1 sm:h-9">
                      <button
                        type="button"
                        onClick={() => goToShop(term)}
                        className="max-w-48 truncate rounded-sm pr-1.5"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => forget(term)}
                        aria-label={`Remove ${term} from recent searches`}
                        className="inline-flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-3 hover:text-foreground"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-label="Suggested searches">
              <p className="mb-3 text-micro text-ink-muted">Popular silhouettes</p>
              <div className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => goToShop(term)}
                    className="chip h-10 sm:h-9"
                  >
                    <Search className="size-3.5 text-ink-soft" aria-hidden="true" />
                    {term}
                  </button>
                ))}
              </div>
            </section>

            <p className="text-small text-ink-soft">
              Tip: search by silhouette, material or colour — “cognac tote”, “laptop backpack”.
            </p>
          </div>
        )}

        {showSkeleton && (
          <ul className="space-y-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3.5 p-2">
                <span className="skeleton-shimmer size-16 shrink-0 rounded-xl" />
                <span className="flex-1 space-y-2.5">
                  <span className="skeleton-shimmer block h-3.5 w-2/3 rounded-md" />
                  <span className="skeleton-shimmer block h-3 w-1/3 rounded-md" />
                </span>
                <span className="skeleton-shimmer h-3.5 w-14 rounded-md" />
              </li>
            ))}
          </ul>
        )}

        {hasError && (
          <EmptyState
            compact
            icon={SearchX}
            title="Search is taking a moment"
            description="We couldn't reach the atelier just now. Please try again or browse the full collection."
            action={{ label: "Browse all bags", to: "/shop" }}
            className="border-0 bg-transparent shadow-none"
          />
        )}

        {showEmpty && (
          <EmptyState
            compact
            icon={SearchX}
            title="No pieces found"
            description={`We couldn't find anything matching “${q}”. Try a silhouette such as tote, sling or weekender.`}
            action={{ label: "Browse all bags", to: "/shop" }}
            className="border-0 bg-transparent shadow-none"
          />
        )}

        {shownProducts.length > 0 && (
          <div className={cn("transition-opacity duration-300", stale && "opacity-50")} aria-busy={stale || undefined}>
            <p className="px-2 pb-2 pt-1 text-micro text-ink-muted">
              Pieces{settled ? ` · ${products.length}` : ""}
            </p>
            <ul id="search-results" className="space-y-0.5" onKeyDown={handleListKeyDown}>
              {shownProducts.map((product) => (
                <li key={product._id}>
                  <Link
                    to={`/product/${product._id}`}
                    onClick={() => {
                      remember(q);
                      onClose();
                    }}
                    className="group/row flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
                  >
                    <ImageWithFallback
                      src={getProductImages(product)[0]}
                      alt=""
                      ratio="1/1"
                      className="size-16 shrink-0 rounded-xl"
                      imgClassName="transition-transform duration-700 ease-luxury group-hover/row:scale-105"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-foreground">
                        {product.name}
                      </span>
                      <span className="block truncate text-small text-ink-muted">
                        {product.categoryId?.name || product.brand || "Niya Bags"}
                      </span>
                    </span>
                    <PriceTag product={product} size="sm" showDiscount={false} className="shrink-0 justify-end" />
                    <ArrowRight
                      className="size-4 shrink-0 text-ink-soft opacity-0 transition-all duration-300 group-hover/row:translate-x-0.5 group-hover/row:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ---- Footer ---- */}
      {q !== "" && (
        <div className="border-t border-line bg-surface px-3 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => goToShop(q)}
            className="btn btn-primary btn-sm btn-block max-w-full sm:w-auto"
          >
            <span className="min-w-0 truncate">View all results for “{q}”</span>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

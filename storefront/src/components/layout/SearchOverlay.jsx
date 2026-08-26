import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { closeSearch } from "../../features/ui/uiSlice";
import API from "../../api/axios";
import { getAssetUrl } from "../../utils/assetUrl";
import {
  effectivePrice,
  formatCurrency,
  productImage,
} from "../../utils/format";
import { SearchIcon, CloseIcon } from "../common/Icons";

/** Full-screen search overlay — debounced product search */
export default function SearchOverlay() {
  const open = useSelector((state) => state.ui.searchOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Reset + focus overlay khulne par (async — lint-safe)
    const t = setTimeout(() => {
      setQuery("");
      setResults([]);
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") dispatch(closeSearch());
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch]);

  useEffect(() => {
    const trimmed = query.trim();
    // Saare setState async callback me — sync effect body me nahi (lint-safe)
    const timer = setTimeout(async () => {
      if (!trimmed) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await API.get(
          `/products?search=${encodeURIComponent(trimmed)}&limit=6`,
        );
        setResults(response.data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, trimmed ? 350 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const goToProduct = (id) => {
    dispatch(closeSearch());
    navigate(`/product/${id}`);
  };

  return (
    <div className="overlay z-80" onClick={() => dispatch(closeSearch())}>
      <div
        className="mx-auto mt-20 w-[min(640px,92vw)] overflow-hidden rounded-2xl"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border-strong)",
          boxShadow: "var(--shadow-pop)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <SearchIcon size={19} style={{ color: "var(--ink-muted)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bags, wallets, totes…"
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "var(--ink)" }}
          />
          <button
            className="icon-btn"
            aria-label="Close search"
            onClick={() => dispatch(closeSearch())}
          >
            <CloseIcon size={17} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {loading && (
            <p
              className="px-4 py-3 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              Searching…
            </p>
          )}
          {!loading && query.trim() && !results.length && (
            <p
              className="px-4 py-3 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              No products found for “{query}”.
            </p>
          )}
          {!query.trim() && (
            <p
              className="px-4 py-3 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              Start typing to search the collection…
            </p>
          )}
          {results.map((product) => (
            <button
              key={product._id}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/5"
              onClick={() => goToProduct(product._id)}
            >
              <div
                className="h-14 w-12 shrink-0 overflow-hidden rounded-lg"
                style={{ background: "var(--bg-raised)" }}
              >
                {productImage(product) && (
                  <img
                    src={getAssetUrl(productImage(product))}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {formatCurrency(effectivePrice(product))}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

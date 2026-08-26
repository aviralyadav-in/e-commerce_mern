import { useState } from "react";
import { useSearchParams } from "react-router";
import { useSelector } from "react-redux";

const COLLECTION_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "best", label: "Best Sellers" },
  { value: "new", label: "New Arrivals" },
];

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--ink-muted)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function FilterGroup({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="py-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="mt-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onChange, label }) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 text-sm"
      style={{ color: checked ? "var(--ink)" : "var(--ink-muted)" }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          accentColor: "var(--accent)",
          width: 15,
          height: 15,
          cursor: "pointer",
        }}
      />
      {label}
    </label>
  );
}

/**
 * Shop page sidebar — reference-style:
 * collapsible WOMEN / MEN / COLLECTION checkbox groups + price + search.
 */
export default function ShopFilters({ search, setSearch }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const categories = useSelector((state) => state.categories.categories);

  const selectedSlugs = (searchParams.get("category") || "")
    .split(",")
    .filter(Boolean);
  const selectedCollections = (searchParams.get("collection") || "")
    .split(",")
    .filter(Boolean);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // filter change → page reset
    setSearchParams(next);
  };

  // Multi-select toggle — comma-joined URL param me save hota hai
  const toggleValue = (key, current, value) => {
    const set = new Set(current);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setParam(key, Array.from(set).join(","));
  };

  // Categories ko gender groups me baanto (category.subCategories se)
  const womenCategories = categories.filter((c) =>
    c.subCategories?.includes("Women"),
  );
  const menCategories = categories.filter((c) =>
    c.subCategories?.includes("Men"),
  );

  const hasFilters =
    searchParams.get("category") ||
    searchParams.get("collection") ||
    searchParams.get("sale") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice") ||
    searchParams.get("search");

  return (
    <div>
      <p className="eyebrow mb-1">Filters</p>

      {/* Search */}
      <form
        className="border-b py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
        onSubmit={(e) => {
          e.preventDefault();
          setParam("search", search);
        }}
      >
        <input
          className="field"
          placeholder="Search bags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {/* WOMEN */}
      {womenCategories.length > 0 && (
        <FilterGroup title="Women">
          {womenCategories.map((c) => (
            <CheckRow
              key={c._id}
              label={c.name}
              checked={selectedSlugs.includes(c.slug)}
              onChange={() => toggleValue("category", selectedSlugs, c.slug)}
            />
          ))}
        </FilterGroup>
      )}

      {/* MEN */}
      {menCategories.length > 0 && (
        <FilterGroup title="Men">
          {menCategories.map((c) => (
            <CheckRow
              key={c._id}
              label={c.name}
              checked={selectedSlugs.includes(c.slug)}
              onChange={() => toggleValue("category", selectedSlugs, c.slug)}
            />
          ))}
        </FilterGroup>
      )}

      {/* COLLECTION */}
      <FilterGroup title="Collection">
        {COLLECTION_OPTIONS.map((opt) => (
          <CheckRow
            key={opt.value}
            label={opt.label}
            checked={selectedCollections.includes(opt.value)}
            onChange={() =>
              toggleValue("collection", selectedCollections, opt.value)
            }
          />
        ))}
      </FilterGroup>

      {/* Price range */}
      <form
        className="border-b py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
        onSubmit={(e) => {
          e.preventDefault();
          setParam("minPrice", minPrice);
          setParam("maxPrice", maxPrice);
        }}
      >
        <label className="field-label">Price Range (₹)</label>
        <div className="flex items-center gap-2">
          <input
            className="field px-2.5! py-2! text-xs"
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span style={{ color: "var(--ink-faint)" }}>–</span>
          <input
            className="field px-2.5! py-2! text-xs"
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <button
          className="btn btn-outline mt-3 w-full py-2! text-[11px]!"
          type="submit"
        >
          Apply
        </button>
      </form>

      {/* Clear all */}
      {hasFilters && (
        <button
          className="mt-4 w-full text-xs font-semibold underline"
          style={{ color: "var(--ink-muted)" }}
          onClick={() => setSearchParams({})}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

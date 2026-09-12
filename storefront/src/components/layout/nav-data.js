/**
 * Shared navigation data helpers for the header, mega menu and mobile sheet.
 * Pure functions only — no React, no side effects.
 */

/** Routes that render the ShopPage (see App.jsx). */
export const SHOP_PATHS = ["/shop", "/products", "/catalog", "/collections"];

/** Primary links shown in the desktop nav and the mobile sheet. */
export const PRIMARY_LINKS = [
  { key: "all", label: "All bags", to: "/shop" },
  { key: "women", label: "Women", to: "/shop?gender=Women" },
  { key: "men", label: "Men", to: "/shop?gender=Men" },
  { key: "contact", label: "Concierge", to: "/contact" },
];

/** Quick search suggestions (chips) in the search dialog. */
export const SEARCH_SUGGESTIONS = ["Tote", "Crossbody", "Weekender", "Wallet", "Backpack"];

const bySortOrder = (a, b) =>
  (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
  String(a.name || "").localeCompare(String(b.name || ""));

/**
 * Build a category tree from the flat `/categories` payload.
 * Roots are level-0 categories (or orphans whose parent is not in the list).
 * Each node: { ...category, depth, children: [] }
 */
export function buildCategoryTree(categories = []) {
  const active = (Array.isArray(categories) ? categories : []).filter(
    (c) => c && c._id && c.isActive !== false
  );
  const ids = new Set(active.map((c) => String(c._id)));
  const byParent = new Map();

  active.forEach((c) => {
    const parent = c.parentId && ids.has(String(c.parentId)) ? String(c.parentId) : null;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(c);
  });

  const build = (parent, depth, seen) =>
    (byParent.get(parent) || [])
      .slice()
      .sort(bySortOrder)
      .map((c) => {
        const id = String(c._id);
        if (seen.has(id)) return { ...c, depth, children: [] };
        const next = new Set(seen);
        next.add(id);
        return { ...c, depth, children: build(id, depth + 1, next) };
      });

  return build(null, 0, new Set());
}

/** Depth-first flatten of a subtree (children of a node), keeping `depth`. */
export function flattenCategoryTree(nodes = [], out = []) {
  nodes.forEach((n) => {
    out.push(n);
    if (n.children && n.children.length) flattenCategoryTree(n.children, out);
  });
  return out;
}

/** Which primary link is "current" for the given router location. */
export function getActiveNavKey(location) {
  if (!location) return null;
  const { pathname, search } = location;
  if (pathname === "/contact") return "contact";
  if (!SHOP_PATHS.includes(pathname)) return null;
  const params = new URLSearchParams(search || "");
  const gender = params.get("gender");
  if (gender === "Women") return "women";
  if (gender === "Men") return "men";
  if (!gender) return "all";
  return null;
}

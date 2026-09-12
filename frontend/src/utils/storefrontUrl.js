/**
 * Helper to build live storefront URLs from Admin panel.
 * Default fallback is http://localhost:5173
 */
export const getStorefrontUrl = (path = "") => {
  const base = import.meta.env.VITE_STOREFRONT_URL || "http://localhost:5173";
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
};

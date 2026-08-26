/**
 * VITE_API_BASE_URL = http://localhost:5000/api
 * Images/static files server root pe hote hain → /api hata kar base banate hain
 */
export const getServerBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return apiBase.replace(/\/api\/?$/, "");
};

/**
 * Relative upload path ko full image URL me convert karta hai.
 * Agar pehle se http/https ho toh waisa hi return.
 */
export const getAssetUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getServerBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

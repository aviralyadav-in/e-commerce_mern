import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx and twMerge
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Calculate savings percentage
 */
export function calculateDiscount(price, discountPrice) {
  if (!discountPrice || discountPrice >= price || price <= 0) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

/**
 * Get effective selling price
 */
export function getSellingPrice(product) {
  if (!product) return 0;
  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discountPrice);
  if (discountPrice && discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }
  return price;
}

export const FALLBACK_BAG_IMAGE = "/placeholder-bag.svg";

/**
 * Format image URL (handles Cloudinary, uploads, and placeholders)
 */
export function getImageUrl(img) {
  if (!img) return FALLBACK_BAG_IMAGE;
  if (typeof img !== "string") return FALLBACK_BAG_IMAGE;
  // Local static assets (placeholder, /icons.svg …) are served by the storefront itself
  if (img === FALLBACK_BAG_IMAGE || img.startsWith("/placeholder") || img.startsWith("/icons") || img.startsWith("/favicon")) {
    return img;
  }
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:") || img.startsWith("blob:")) {
    return img;
  }
  // Local backend uploads path
  const apiBase =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:5000/api";
  const base = apiBase.replace(/\/api\/?$/, "");
  const cleanPath = img.startsWith("/") ? img : `/${img}`;
  return `${base}${cleanPath}`;
}

/**
 * Graceful image error handler for img elements
 */
export function handleImageError(e) {
  if (e.currentTarget.src !== FALLBACK_BAG_IMAGE && !e.currentTarget.src.endsWith(FALLBACK_BAG_IMAGE)) {
    e.currentTarget.src = FALLBACK_BAG_IMAGE;
  }
}

/**
 * Normalise every image shape the API can return into a non-empty array of
 * raw image paths (not yet passed through getImageUrl).
 *   - product.images.desktop / product.images.mobile
 *   - product.images (plain array)
 *   - product.image (single string)
 *   - variant images when a variant name is given
 */
export function getProductImages(product, variantName = null, { prefer = "desktop" } = {}) {
  if (!product) return [FALLBACK_BAG_IMAGE];

  const variant =
    variantName && Array.isArray(product.variants)
      ? product.variants.find((v) => v?.name === variantName)
      : null;
  const variantImages = Array.isArray(variant?.images) ? variant.images.filter(Boolean) : [];

  let base = [];
  if (product.images && typeof product.images === "object" && !Array.isArray(product.images)) {
    const primary = Array.isArray(product.images[prefer]) ? product.images[prefer] : [];
    const secondary = Array.isArray(product.images[prefer === "desktop" ? "mobile" : "desktop"])
      ? product.images[prefer === "desktop" ? "mobile" : "desktop"]
      : [];
    base = primary.length ? primary : secondary;
  } else if (Array.isArray(product.images)) {
    base = product.images;
  } else if (typeof product.image === "string") {
    base = [product.image];
  }

  const merged = [...variantImages, ...base].filter(Boolean);
  return merged.length ? merged : [FALLBACK_BAG_IMAGE];
}

/**
 * Stock helper — one place to decide the badge/label copy.
 */
export function getStockLabel(product, lowStockAt = 3) {
  const stock = Number(product?.stock);
  if (Number.isNaN(stock)) return { status: "in", label: "In stock", tone: "success" };
  if (stock <= 0) return { status: "out", label: "Sold out", tone: "muted" };
  if (stock <= lowStockAt) return { status: "low", label: `Only ${stock} left`, tone: "gold" };
  return { status: "in", label: "In stock", tone: "success" };
}

/**
 * Human-friendly dates (en-IN). `variant`: "short" (12 Sep 2026), "long"
 * (12 September 2026), "datetime" (12 Sep 2026, 10:30 am).
 */
export function formatDate(value, variant = "short") {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const opts =
    variant === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : variant === "datetime"
        ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
        : { day: "numeric", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  const n = Number(count) || 0;
  return `${n} ${n === 1 ? singular : plural}`;
}

export function clampText(text, max = 120) {
  if (!text) return "";
  const s = String(text).trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/**
 * Build a /shop query string from a params object, dropping empty values.
 *   buildShopSearch({ gender: "Women", collections: id }) -> "/shop?gender=Women&collections=..."
 */
export function buildShopSearch(params = {}, path = "/shop") {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === false || v === "All") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/**
 * Map a hex/colour name from variant data into something renderable.
 */
export function getVariantColor(variant) {
  if (!variant) return "#C5A880";
  if (variant.colorCode) return variant.colorCode;
  const n = String(variant.name || "").toLowerCase();
  if (n.includes("black") || n.includes("onyx") || n.includes("noir")) return "#141414";
  if (n.includes("brown") || n.includes("tan") || n.includes("cognac") || n.includes("chocolate")) return "#8B5A2B";
  if (n.includes("navy") || n.includes("blue")) return "#1F2A44";
  if (n.includes("green") || n.includes("olive") || n.includes("forest")) return "#3F5A3A";
  if (n.includes("red") || n.includes("burgundy") || n.includes("wine") || n.includes("maroon")) return "#6B1F2A";
  if (n.includes("grey") || n.includes("gray") || n.includes("slate")) return "#7A7A7A";
  if (n.includes("white") || n.includes("ivory") || n.includes("cream")) return "#F1EBE0";
  if (n.includes("beige") || n.includes("nude") || n.includes("camel") || n.includes("sand")) return "#C9B196";
  if (n.includes("pink") || n.includes("blush") || n.includes("rose")) return "#D9A5A5";
  return "#C5A880";
}

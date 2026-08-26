/**
 * Shared display formatters — currency / dates sab jagah identical dikhein.
 */

export const formatCurrency = (value) => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(value)} · ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

/** Discounted (effective) price — discountPrice ho toh wahi, warna price. */
export const effectivePrice = (product) => {
  if (!product) return 0;
  const discount = Number(product.discountPrice);
  return discount && discount > 0 && discount < Number(product.price)
    ? discount
    : Number(product.price) || 0;
};

/** Discount percentage (0 agar discount nahi hai). */
export const discountPercent = (product) => {
  if (!product) return 0;
  const price = Number(product.price) || 0;
  const discount = Number(product.discountPrice) || 0;
  if (!discount || discount >= price || discount <= 0) return 0;
  return Math.round(((price - discount) / price) * 100);
};

/** Product ki pehli desktop image ka full URL. */
export const productImage = (product, index = 0) => {
  const imgs = product?.images?.desktop || [];
  return imgs[index] || imgs[0] || "";
};

export const titleCase = (s) =>
  String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

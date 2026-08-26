/**
 * Shared display formatters, so currency / dates / ids look identical
 * on every screen.
 */

export const formatCurrency = (value, { compact = false } = {}) => {
  const n = Number(value) || 0;
  if (compact && Math.abs(n) >= 100000)
    return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (compact && Math.abs(n) >= 1000)
    return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const formatNumber = (value) =>
  (Number(value) || 0).toLocaleString("en-IN");

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

export const formatRelative = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};

/** Short, readable stand-in for a Mongo ObjectId. */
export const shortId = (id) => (id ? `#${String(id).slice(-6).toUpperCase()}` : "—");

export const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const titleCase = (s) =>
  String(s || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Lightweight zero-dependency CSV utilities (admin bulk uploads ke liye).
 *
 * Supported: quoted fields, embedded commas/newlines inside quotes,
 * escaped double-quotes ("" → "), CRLF/LF line endings, UTF-8 BOM.
 */

/** Raw CSV text → array of arrays (cell matrix) */
export function parseCsv(text) {
  if (typeof text !== "string") return [];

  // UTF-8 BOM strip
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // Escaped quote ""
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // \r\n ka \r part — ignore, \n handle kar lega
    } else {
      field += char;
    }
  }

  // Aakhri field/row (file agar newline par end nahi hui)
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** CSV text → array of objects (pehli row header maani jaati hai).
 *  Header keys trim + lowercase hote hain; poori khali lines skip. */
export function csvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const header = rows[0].map((h) => String(h ?? "").trim().toLowerCase());
  const records = [];

  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    if (cells.every((c) => String(c ?? "").trim() === "")) continue; // blank line

    const obj = {};
    header.forEach((key, idx) => {
      if (key) obj[key] = String(cells[idx] ?? "").trim();
    });
    records.push(obj);
  }

  return records;
}

/** Name → URL-safe slug ("Leather Tote!" → "leather-tote", "Urban_Backpack" → "urban-backpack") */
export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // spaces/underscores pehle dash banao
    .replace(/[^a-z0-9-]/g, "") // baaki invalid chars strip
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** CSV boolean cell ("true"/"1"/"yes") → boolean, warna fallback */
export function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const s = String(value).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

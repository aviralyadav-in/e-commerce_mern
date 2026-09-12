import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, "..", "uploads");

/**
 * Public ID extractor kept for backward compatibility.
 */
export const extractPublicId = (url) => {
  if (!url || typeof url !== "string") return null;
  return url;
};

/**
 * Safely deletes an uploaded asset from local disk (backend/uploads/...).
 * Accepts relative paths ("/uploads/products/image.jpg", "uploads/..."),
 * or full localhost URLs ("http://localhost:5000/uploads/...").
 *
 * @param {string} url - Upload path or URL
 * @returns {Promise<void>}
 */
export const deleteFile = async (url) => {
  if (!url || typeof url !== "string") return;

  const trimmed = url.trim();
  if (!trimmed) return;

  // 1. Strip protocol/host if full URL was passed
  let relativePath = trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      relativePath = parsed.pathname;
    } catch {
      // not a valid URL, proceed with trimmed string
    }
  }

  // 2. Resolve to local uploads path
  if (relativePath.startsWith("/uploads/") || relativePath.startsWith("uploads/")) {
    try {
      const cleanSubPath = relativePath.replace(/^\/?uploads\//, "");
      const filePath = path.resolve(UPLOADS_ROOT, cleanSubPath);

      // Path traversal security check — must remain inside uploads directory
      if (filePath.startsWith(UPLOADS_ROOT + path.sep)) {
        await fs.unlink(filePath);
      }
    } catch (err) {
      // ENOENT means file already deleted or doesn't exist — ignore silently
      if (err.code !== "ENOENT") {
        console.error("Local file delete error:", err.message || err);
      }
    }
  }
};

// Aliases for compatibility
export const deleteUploadedFile = deleteFile;
export const deleteFromCloudinary = deleteFile;

/**
 * Safely deletes multiple uploaded assets from disk in parallel.
 *
 * @param {string[]} urls - Array of file paths / URLs
 * @returns {Promise<void[]>}
 */
export const deleteMultipleFiles = async (urls) => {
  if (!Array.isArray(urls) || !urls.length) return [];
  const validItems = urls.filter((item) => typeof item === "string" && item.trim());
  return Promise.all(validItems.map((item) => deleteFile(item)));
};

export const deleteMultipleFromCloudinary = deleteMultipleFiles;

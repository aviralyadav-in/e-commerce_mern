import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_BASE = path.resolve(__dirname, "..", "uploads");

const MB = 1024 * 1024;
const IMAGE_MAX_SIZE = 5 * MB;
const PRODUCT_IMAGE_MAX_SIZE = 10 * MB;
const CSV_MAX_SIZE = 2 * MB;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/jpg",
];

// fileFilter rejections ko baaki errors se alag pehchaanne ke liye code
const INVALID_FILE_TYPE = "INVALID_FILE_TYPE";
const invalidFileError = (message) =>
  Object.assign(new Error(message), { code: INVALID_FILE_TYPE });

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(invalidFileError("Only JPG, PNG, WEBP and AVIF images are allowed"), false);
  }
};

const normalizeFilePath = (subFolder, filename) => `/uploads/${subFolder}/${filename}`;

/**
 * Creates a Multer upload instance configured with local diskStorage.
 * Stores files in backend/uploads/<subFolder> and normalizes file.path
 * to web-friendly relative path: "/uploads/<subFolder>/<filename>".
 *
 * @param {string} subFolder - Subfolder name inside 'uploads' directory
 * @param {number} maxFileSize - Maximum file size in bytes (default: 5MB)
 */
const createLocalUpload = (subFolder, maxFileSize = IMAGE_MAX_SIZE) => {
  const destDir = path.resolve(UPLOADS_BASE, subFolder);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      cb(null, destDir);
    },
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
      const nameWithoutExt = path
        .basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30);
      const uniqueFilename = `${nameWithoutExt || "image"}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueFilename);
    },
  });

  const uploadInstance = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: maxFileSize,
    },
  });

  return {
    single: (fieldName) => (req, res, next) => {
      uploadInstance.single(fieldName)(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
          req.file.path = normalizeFilePath(subFolder, req.file.filename);
        }
        next();
      });
    },
    fields: (fieldsArray) => (req, res, next) => {
      uploadInstance.fields(fieldsArray)(req, res, (err) => {
        if (err) return next(err);
        if (req.files) {
          for (const key of Object.keys(req.files)) {
            req.files[key].forEach((f) => {
              f.path = normalizeFilePath(subFolder, f.filename);
            });
          }
        }
        next();
      });
    },
    array: (fieldName, maxCount) => (req, res, next) => {
      uploadInstance.array(fieldName, maxCount)(req, res, (err) => {
        if (err) return next(err);
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((f) => {
            f.path = normalizeFilePath(subFolder, f.filename);
          });
        }
        next();
      });
    },
  };
};

// Exports for entity image uploads (Local Disk Storage)
export const categoryUpload = createLocalUpload("categories");
export const collectionUpload = createLocalUpload("collections");
export const productUpload = createLocalUpload("products", PRODUCT_IMAGE_MAX_SIZE); // 10MB for products
export const bannerUpload = createLocalUpload("banners");
export const avatarUpload = createLocalUpload("avatars");

/* =========================================================
   UPLOAD ERROR HANDLER (index.js me global handler se pehle)
   Multer / fileFilter errors ko clean JSON response me badalta hai
========================================================= */
const PRODUCT_IMAGE_FIELDS = new Set(["desktopImages", "mobileImages", "variantImages"]);

const maxSizeForField = (field) => {
  if (field === "file") return CSV_MAX_SIZE;
  if (PRODUCT_IMAGE_FIELDS.has(field)) return PRODUCT_IMAGE_MAX_SIZE;
  return IMAGE_MAX_SIZE;
};

export const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: `File must be ${maxSizeForField(err.field) / MB}MB or smaller`,
      });
    }
    // LIMIT_UNEXPECTED_FILE (galat field / maxCount se zyada files) etc.
    return res.status(400).json({ message: err.message, field: err.field });
  }

  if (err?.code === INVALID_FILE_TYPE) {
    return res.status(400).json({ message: err.message });
  }

  return next(err);
};

/* =========================================================
   Avatar upload WITH error handling wrapper
========================================================= */
export const avatarUploadWithErrorHandling = [
  avatarUpload.single("avatar"),

  (err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Avatar image must be 5MB or smaller",
      });
    }
    return uploadErrorHandler(err, req, res, next);
  },
];

/* =========================================================
   CSV BULK UPLOAD (memory storage — file buffer direct
   controllers parse karte hain)
========================================================= */
const ALLOWED_CSV_MIMES = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
];

const csvFileFilter = (req, file, cb) => {
  const isCsvExtension = path.extname(file.originalname).toLowerCase() === ".csv";
  if (isCsvExtension && ALLOWED_CSV_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(invalidFileError("Only .csv files are allowed"), false);
  }
};

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: {
    fileSize: CSV_MAX_SIZE, // 2MB — bulk CSV ke liye kaafi
  },
});

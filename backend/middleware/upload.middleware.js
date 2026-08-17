import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");

// 1. Yahan 'banners' folder add kiya gaya hai
const foldersToCreate = [
  uploadDir,
  path.join(uploadDir, "categories"),
  path.join(uploadDir, "products"),
  path.join(uploadDir, "banners"), // 🔥 Banner folder added
];

foldersToCreate.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✅ Folder created: ${folder}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed"), false);
  }
};

const createUpload = (subFolder) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = subFolder ? path.join(uploadDir, subFolder) : uploadDir;
      cb(null, folder);
    },

    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}${extension}`;
      cb(null, uniqueName);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
};

// Exports
export const categoryUpload = createUpload("categories");
export const productUpload = createUpload("products");
export const bannerUpload = createUpload("banners"); // 🔥 Banner export added

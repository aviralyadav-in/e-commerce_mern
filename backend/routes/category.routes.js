import express from "express";
import { categoryUpload, csvUpload } from "../middleware/upload.middleware.js";

import {
  bulkCreateCategories,
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategories,
  getCategoryById,
  getCategoryProducts,
  restoreCategory,
  updateCategory,
} from "../controllers/category.controller.js";

import { adminRoute } from "../middleware/admin.middleware.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const categoryRouter = express.Router();

categoryRouter.get("/", getCategories);

// Admin — inactive (soft-deleted) categories bhi, restore UI ke liye
categoryRouter.get("/admin/all", adminRoute, getAdminCategories);
categoryRouter.get("/:id", getCategoryById);
categoryRouter.get("/:id/products", getCategoryProducts);

// 🆕 Bulk import via CSV (pehle rakha hai taaki /admin/:id se na takrao)
categoryRouter.post(
  "/admin/bulk",
  adminRoute,
  csvUpload.single("file"),
  bulkCreateCategories,
);

categoryRouter.post(
  "/admin",
  adminRoute,
  categoryUpload.single("image"),
  createCategory,
);

categoryRouter.put(
  "/admin/:id",
  adminRoute,
  categoryUpload.single("image"),
  updateCategory,
);

categoryRouter.patch("/admin/:id/restore", adminRoute, restoreCategory);

categoryRouter.delete("/admin/:id", adminRoute, deleteCategory);

export default categoryRouter;

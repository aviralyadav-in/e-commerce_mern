import express from "express";
import { categoryUpload } from "../middleware/upload.middleware.js";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  getCategoryProducts,
  updateCategory,
} from "../controllers/category.controller.js";

import { adminRoute } from "../middleware/admin.middleware.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const categoryRouter = express.Router();

categoryRouter.get("/", getCategories);
categoryRouter.get("/:id", getCategoryById);
categoryRouter.get("/:id/products", getCategoryProducts);

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

categoryRouter.delete("/admin/:id", adminRoute, deleteCategory);

export default categoryRouter;

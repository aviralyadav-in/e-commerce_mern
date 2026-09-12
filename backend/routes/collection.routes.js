import express from "express";
import { collectionUpload, csvUpload } from "../middleware/upload.middleware.js";

import {
  bulkCreateCollections,
  createCollection,
  deleteCollection,
  getAdminCollections,
  bulkAddProductsToCollection,
  getCollectionById,
  getCollections,
  restoreCollection,
  toggleCollectionStatus,
  updateCollection,
} from "../controllers/collection.controller.js";

import { adminRoute } from "../middleware/admin.middleware.js";

const collectionRouter = express.Router();

collectionRouter.get("/", getCollections);

// Admin — inactive (soft-deleted) collections bhi, restore UI ke liye
// (/:id se pehle register — Express param clash se bachne ke liye)
collectionRouter.get("/admin/all", adminRoute, getAdminCollections);

// 🆕 Bulk import via CSV
collectionRouter.post(
  "/admin/bulk",
  adminRoute,
  csvUpload.single("file"),
  bulkCreateCollections,
);

// 🆕 Products table bulk action — selected products → collection
// (POST /admin exact-path hai, /admin/:id PUT hai — koi clash nahi)
collectionRouter.post(
  "/admin/bulk-add-products",
  adminRoute,
  bulkAddProductsToCollection,
);

collectionRouter.get("/:id", getCollectionById);

collectionRouter.post(
  "/admin",
  adminRoute,
  collectionUpload.single("image"),
  createCollection,
);

collectionRouter.put(
  "/admin/:id",
  adminRoute,
  collectionUpload.single("image"),
  updateCollection,
);

collectionRouter.patch("/admin/:id/restore", adminRoute, restoreCollection);
collectionRouter.patch(
  "/admin/:id/toggle-status",
  adminRoute,
  toggleCollectionStatus,
);
collectionRouter.delete("/admin/:id", adminRoute, deleteCollection);

export default collectionRouter;

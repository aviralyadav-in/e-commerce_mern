import express from "express";
import { collectionUpload } from "../middleware/upload.middleware.js";

import {
  createCollection,
  deleteCollection,
  getAdminCollections,
  getCollectionById,
  getCollections,
  restoreCollection,
  updateCollection,
} from "../controllers/collection.controller.js";

import { adminRoute } from "../middleware/admin.middleware.js";

const collectionRouter = express.Router();

collectionRouter.get("/", getCollections);

// Admin — inactive (soft-deleted) collections bhi, restore UI ke liye
// (/:id se pehle register — Express param clash se bachne ke liye)
collectionRouter.get("/admin/all", adminRoute, getAdminCollections);
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
collectionRouter.delete("/admin/:id", adminRoute, deleteCollection);

export default collectionRouter;

import express from "express";

import {
  bulkCreateProducts,
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";

import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";
import { productUpload, csvUpload } from "../middleware/upload.middleware.js";

const productRouter = express.Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProductById);

// 🆕 Bulk import via CSV (dropdown-category method — body me categoryId)
productRouter.post(
  "/admin/bulk",
  adminRoute,
  csvUpload.single("file"),
  bulkCreateProducts,
);

productRouter.post(
  "/admin",
  adminRoute,
  productUpload.fields([
    { name: "desktopImages", maxCount: 5 },
    { name: "mobileImages", maxCount: 5 },
    { name: "variantImages", maxCount: 20 }, // 🆕 Color variant images
  ]),
  createProduct,
);

productRouter.put(
  "/admin/:id",
  adminRoute,
  productUpload.fields([
    { name: "desktopImages", maxCount: 5 },
    { name: "mobileImages", maxCount: 5 },
    { name: "variantImages", maxCount: 20 }, // 🆕 Color variant images
  ]),
  updateProduct,
);

productRouter.delete("/admin/:id", adminRoute, deleteProduct);

export default productRouter;

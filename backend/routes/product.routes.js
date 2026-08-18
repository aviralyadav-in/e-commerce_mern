import express from "express";

import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";

import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";
import { productUpload } from "../middleware/upload.middleware.js";

const productRouter = express.Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProductById);

productRouter.post(
  "/admin",
  adminRoute,
  productUpload.fields([
    { name: "desktopImages", maxCount: 5 },
    { name: "mobileImages", maxCount: 5 },
  ]),
  createProduct,
);

productRouter.put(
  "/admin/:id",
  adminRoute,
  productUpload.fields([
    { name: "desktopImages", maxCount: 5 },
    { name: "mobileImages", maxCount: 5 },
  ]),
  updateProduct,
);

productRouter.delete("/admin/:id", adminRoute, deleteProduct);

export default productRouter;

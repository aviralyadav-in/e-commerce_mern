import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  getAllCarts,
} from "../controllers/cart.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const cartRouter = express.Router();

// ==========================================
// ADMIN CART ROUTES (Admin middleware lagega)
// ==========================================

// 5. Get All Users' Carts (GET /api/cart/admin/all) — Admin Only
cartRouter.get("/admin/all", adminRoute, getAllCarts);

// ==========================================
// USER CART ROUTES (Protected middleware lagega)
// ==========================================

cartRouter.use(protectedRoute);

// 1. Get User Cart (GET /api/cart)
cartRouter.get("/", getCart);

// 2. Add Item to Cart / Update Quantity (POST /api/cart/add)
cartRouter.post("/add", addToCart);

// 3. Remove Specific Item from Cart (DELETE /api/cart/remove/:productId)
cartRouter.delete("/remove/:productId", removeFromCart);

// 4. Clear Entire Cart (DELETE /api/cart/clear)
cartRouter.delete("/clear", clearCart);

export default cartRouter;


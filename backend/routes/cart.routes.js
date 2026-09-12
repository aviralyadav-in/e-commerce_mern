import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getAllCarts,
  adminAddToCart,
  adminRemoveFromCart,
  adminUpdateCartQuantity,
} from "../controllers/cart.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const cartRouter = express.Router();

// ==========================================
// ADMIN CART ROUTES (Admin middleware lagega)
// ==========================================

// 5. Get All Users' Carts (GET /api/cart/admin/all) — Admin Only
cartRouter.get("/admin/all", adminRoute, getAllCarts);

// 6. Admin Add Item to Customer's Cart (POST /api/cart/admin/add)
cartRouter.post("/admin/add", adminRoute, adminAddToCart);

// 7. Admin Update Customer's Cart Quantity (PUT /api/cart/admin/quantity)
cartRouter.put("/admin/quantity", adminRoute, adminUpdateCartQuantity);

// 8. Admin Remove Item from Customer's Cart (DELETE /api/cart/admin/remove or /admin/:userId/:productId)
cartRouter.delete("/admin/remove", adminRoute, adminRemoveFromCart);
cartRouter.delete("/admin/:userId/:productId", adminRoute, adminRemoveFromCart);

// ==========================================
// USER CART ROUTES (Protected middleware lagega)
// ==========================================

cartRouter.use(protectedRoute);

// 1. Get User Cart (GET /api/cart)
cartRouter.get("/", getCart);

// 2. Add Item to Cart / Update Quantity (POST /api/cart/add)
cartRouter.post("/add", addToCart);

// 2b. Set Absolute Quantity of a Cart Item (PUT /api/cart/update/:productId)
cartRouter.put("/update/:productId", updateCartItem);

// 3. Remove Specific Item from Cart (DELETE /api/cart/remove/:productId)
cartRouter.delete("/remove/:productId", removeFromCart);

// 4. Clear Entire Cart (DELETE /api/cart/clear)
cartRouter.delete("/clear", clearCart);

export default cartRouter;


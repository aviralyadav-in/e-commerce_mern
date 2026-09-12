import express from "express";
import {
  toggleWishlist,
  getUserWishlist,
  getAllWishlists,
  adminAddToWishlist,
  adminRemoveWishlistItem,
} from "../controllers/wishlist.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const wishlistRouter = express.Router();

// ==========================================
// WISHLIST ROUTES
// ==========================================

// 1. Get User Wishlist (GET /api/wishlist) — User Side
wishlistRouter.get("/", protectedRoute, getUserWishlist);

// 2. Toggle Product in Wishlist (POST /api/wishlist/toggle) — User Side
wishlistRouter.post("/toggle", protectedRoute, toggleWishlist);

// 3. Get All Wishlists (GET /api/wishlist/admin/all) — Admin Side
wishlistRouter.get("/admin/all", adminRoute, getAllWishlists);

// 4. Admin Add to Wishlist (POST /api/wishlist/admin/add) — Admin Side
wishlistRouter.post("/admin/add", adminRoute, adminAddToWishlist);

// 5. Admin Remove from Wishlist (DELETE /api/wishlist/admin/remove or /api/wishlist/admin/:userId/:productId)
wishlistRouter.delete("/admin/remove", adminRoute, adminRemoveWishlistItem);
wishlistRouter.delete("/admin/:userId/:productId", adminRoute, adminRemoveWishlistItem);

export default wishlistRouter;


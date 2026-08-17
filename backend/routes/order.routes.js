import express from "express";
import {
  createOrder,
  myOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";

// Middleware imports (Apne paths ke hisab se adjust kar lein)
import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const orderRouter = express.Router();

// ==========================================
// 🛡️ ADMIN ROUTES (Sirf Admins ke liye)
// FIX: Admin routes ko /:id se PEHLE register karna zaroori hai,
// warna Express "admin" ko :id param samajh lega!
// ==========================================

// 1. Get all orders (Admin Dashboard)
orderRouter.get("/admin/all-orders", adminRoute, getAllOrders);

// 2. Get single order details (Admin)
orderRouter.get("/admin/:id", adminRoute, getOrderById);

// 3. Update order status (Admin)
orderRouter.put("/admin/:id/status", adminRoute, updateOrderStatus);

// ==========================================
// 🧑‍💻 USER ROUTES (Logged-in users ke liye)
// ==========================================

// 4. Create a new order
orderRouter.post("/", protectedRoute, createOrder);

// 5. Get logged-in user's orders
orderRouter.get("/my-orders", protectedRoute, myOrders);

// 6. Get single order details (User)
orderRouter.get("/:id", protectedRoute, getOrderById);

export default orderRouter;

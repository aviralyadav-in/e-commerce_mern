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
// 🧑‍💻 USER ROUTES (Logged-in users ke liye)
// ==========================================

// 1. Create a new order
orderRouter.post("/", protectedRoute, createOrder);

// 2. Get logged-in user's orders
orderRouter.get("/my-orders", protectedRoute, myOrders);

// 3. Get single order details (User)
orderRouter.get("/:id", protectedRoute, getOrderById);

// ==========================================
// 🛡️ ADMIN ROUTES (Sirf Admins ke liye)
// ==========================================

// 4. Get all orders (Admin Dashboard)
orderRouter.get("/admin/all-orders", adminRoute, getAllOrders);

// 5. Get single order details (Admin)
orderRouter.get("/admin/:id", adminRoute, getOrderById);

// 6. Update order status (Admin)
orderRouter.put("/admin/:id/status", adminRoute, updateOrderStatus);

export default orderRouter;

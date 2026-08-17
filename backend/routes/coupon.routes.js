import express from "express";
import {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "../controllers/coupon.controller.js";

import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const couponRouter = express.Router();

// 🧑‍💻 User Route (Coupon Validate/Apply karne ke liye)
couponRouter.post("/apply", protectedRoute, applyCoupon);

// 🛡️ Admin Routes (Coupon Management)
couponRouter.post("/", adminRoute, createCoupon);
couponRouter.get("/", adminRoute, getAllCoupons);
couponRouter.get("/:id", adminRoute, getCouponById);
couponRouter.put("/:id", adminRoute, updateCoupon);
couponRouter.delete("/:id", adminRoute, deleteCoupon);

export default couponRouter;

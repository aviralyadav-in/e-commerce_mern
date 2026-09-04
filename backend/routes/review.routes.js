import express from "express";
import {
  createReview,
  getProductReviews,
  getAllReviews,
  updateReview,
  deleteReview,
  deleteReviewAdmin,
  adminSetReviewStatus,
} from "../controllers/review.controller.js";

import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const reviewRouter = express.Router();

// Admin routes pehle — warna "admin" :productId ban jayega
reviewRouter.get("/admin/all", adminRoute, getAllReviews);
reviewRouter.put("/admin/:id/status", adminRoute, adminSetReviewStatus);
reviewRouter.delete("/admin/:id", adminRoute, deleteReviewAdmin);

reviewRouter.get("/:productId", getProductReviews);

reviewRouter.post("/", protectedRoute, createReview);
reviewRouter.put("/:id", protectedRoute, updateReview);
reviewRouter.delete("/:id", protectedRoute, deleteReview);

export default reviewRouter;

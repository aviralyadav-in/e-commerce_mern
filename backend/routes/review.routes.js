import express from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

import { protectedRoute } from "../middleware/auth.middleware.js";

const reviewRouter = express.Router();

reviewRouter.get("/:productId", getProductReviews);

// 🔒 PROTECTED ROUTES (Sirf logged-in users ke liye)
reviewRouter.post("/", protectedRoute, createReview);
reviewRouter.put("/:id", protectedRoute, updateReview);
reviewRouter.delete("/:id", protectedRoute, deleteReview);

export default reviewRouter;

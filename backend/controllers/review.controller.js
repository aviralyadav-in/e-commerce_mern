import mongoose from "mongoose";
import { Review } from "../models/review.model.js"; // Aapke path ke hisab se
import { Product } from "../models/product.model.js";
import { reviewValidationSchema } from "../validators/reviewValidate.js";

/* =========================================================
   HELPER FUNCTION: Update Product's Average Rating
========================================================= */
const updateProductRating = async (productId) => {
  try {
    // Aggregation pipeline to calculate average rating and count
    const stats = await Review.aggregate([
      {
        $match: { product: new mongoose.Types.ObjectId(productId) },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          numOfReviews: { $sum: 1 },
        },
      },
    ]);

    // Agar reviews hain toh update karein, warna 0 set kar dein
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal (e.g. 4.5)
        numOfReviews: stats[0].numOfReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        numOfReviews: 0,
      });
    }
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
};

/* =========================================================
   1. CREATE REVIEW (User Route)
========================================================= */
export const createReview = async (req, res) => {
  try {
    // Security check: User ID hum token (req.user) se lenge aur body me daalenge
    req.body.user = req.user._id.toString();

    // Validate with Zod
    const result = reviewValidationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { user, product, rating, comment } = result.data;

    // Check if Product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check for Duplicate Review (1 user can give only 1 review per product)
    const alreadyReviewed = await Review.findOne({ user, product });
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Create Review
    const review = await Review.create({
      user,
      product,
      rating,
      comment,
    });

    // Update Product Stats automatically
    await updateProductRating(product);

    return res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Create Review Error:", error);

    // Fallback for MongoDB duplicate key error (Schema index: unique: true)
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET ALL REVIEWS FOR A PRODUCT (Public Route)
========================================================= */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatar") // User ka naam aur photo bhejein
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Reviews fetched successfully",
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get Product Reviews Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. UPDATE REVIEW (User Route)
========================================================= */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Review ID" });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Security Check: Kya ye review ishi user ka hai?
    if (review.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this review" });
    }

    // Partial validation (Kyunki user shayad sirf comment change kare ya sirf rating)
    const result = reviewValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    // Update the review
    if (result.data.rating) review.rating = result.data.rating;
    if (result.data.comment) review.comment = result.data.comment;

    await review.save();

    // Update Product Stats (Kyunki rating change hui ho sakti hai)
    await updateProductRating(review.product);

    return res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update Review Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. DELETE REVIEW (User or Admin Route)
========================================================= */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Review ID" });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Security Check: Review sirf owner delete kar sakta hai YA fir ek Admin
    const isOwner =
      req.user && review.user.toString() === req.user._id.toString();
    const isAdmin = req.admin && req.admin.role === "SuperAdmin"; // req.admin adminRoute se aayega

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review" });
    }

    // Product ID save kar lo stats update karne ke liye
    const productId = review.product;

    await Review.findByIdAndDelete(id);

    // Update Product Stats (Review delete hone ke baad average change hoga)
    await updateProductRating(productId);

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

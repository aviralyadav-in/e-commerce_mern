import { z } from "zod";

// MongoDB ObjectId validate karne ke liye regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const reviewValidationSchema = z.object({
  user: z
    .string({
      error: "User ID is required",
    })
    .regex(objectIdRegex, "Invalid User ID format"),

  product: z
    .string({
      error: "Product ID is required",
    })
    .regex(objectIdRegex, "Invalid Product ID format"),

  rating: z
    .number({
      error: "Please provide a valid rating (number)",
    })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),

  comment: z
    .string({
      error: "Please provide a review comment",
    })
    .trim()
    .min(1, "Please provide a review comment")
    .max(500, "Comment cannot exceed 500 characters"),
});

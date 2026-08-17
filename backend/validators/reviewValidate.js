import { z } from "zod";

// MongoDB ObjectId validate karne ke liye regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const reviewValidationSchema = z.object({
  user: z
    .string({
      required_error: "User ID is required",
      invalid_type_error: "User ID must be a string",
    })
    .regex(objectIdRegex, "Invalid User ID format"),

  product: z
    .string({
      required_error: "Product ID is required",
      invalid_type_error: "Product ID must be a string",
    })
    .regex(objectIdRegex, "Invalid Product ID format"),

  rating: z
    .number({
      required_error: "Please provide a rating",
      invalid_type_error: "Rating must be a number",
    })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),

  comment: z
    .string({
      required_error: "Please provide a review comment",
      invalid_type_error: "Comment must be a string",
    })
    .trim()
    .min(1, "Please provide a review comment")
    .max(500, "Comment cannot exceed 500 characters"),
});

import { z } from "zod";

// MongoDB ObjectId validator
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
      error: "Please provide a valid star rating",
    })
    .int("Rating must be a whole number between 1 and 5")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),

  comment: z
    .string({
      error: "Please provide a review comment",
    })
    .trim()
    .min(5, "Review comment must be at least 5 characters")
    .max(500, "Comment cannot exceed 500 characters"),
});

export const reviewStatusSchema = z.object({
  status: z.enum(["Pending", "Approved", "Hidden"], {
    error: "Status must be either 'Pending', 'Approved', or 'Hidden'",
  }),
});

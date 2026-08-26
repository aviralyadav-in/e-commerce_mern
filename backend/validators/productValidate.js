import { z } from "zod";

export const productValidationSchema = z.object({
  categoryId: z
    .string({
      error: "Category is required",
    })
    // MongoDB ObjectId format validation
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format"),

  name: z
    .string({
      error: "Product name is required",
    })
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .max(200, "Product name cannot exceed 200 characters"),

  slug: z
    .string({
      error: "Slug is required",
    })
    .trim()
    .toLowerCase()
    .min(1, "Slug is required"),

  description: z
    .string({
      error: "Product description is required",
    })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  brand: z.string().trim().optional().default(""),

  subCategory: z
    .enum(["Men", "Women", "Unisex"], {
      error: "Sub-category must be Men, Women, or Unisex",
    })
    .optional()
    .default("Unisex"),

  // 🔥 IMAGE SCHEMA UPDATED HERE 🔥
  images: z.object({
    desktop: z
      .array(z.string({ error: "Desktop image URL must be a string" }))
      .min(1, "Please provide at least one desktop image."), // Mandatory

    mobile: z
      .array(z.string({ error: "Mobile image URL must be a string" }))
      .optional()
      .default([]), // Optional with default empty array
  }),

  price: z
    .number({
      error: "Product price is required and must be a number",
    })
    .min(0, "Price cannot be negative"),

  discountPrice: z
    .number({
      error: "Discount price must be a number",
    })
    .min(0, "Discount price cannot be negative")
    .nullable()
    .optional()
    .default(null),

  sku: z
    .string({
      error: "SKU is required",
    })
    .trim()
    .toUpperCase() // Mongoose ke uppercase: true ke liye
    .min(1, "SKU is required"),

  stock: z
    .number({
      error: "Stock is required and must be a number",
    })
    .min(0, "Stock cannot be negative")
    .optional()
    .default(0),

  isActive: z
    .boolean({
      error: "isActive must be a boolean",
    })
    .optional()
    .default(true),

  averageRating: z.number().optional().default(0),

  numOfReviews: z.number().optional().default(0),

  // Collection flags (FormData se "true"/"false" string aata hai,
  // controller use boolean me parse karta hai)
  isFeatured: z.boolean().optional().default(false),

  isBestSeller: z.boolean().optional().default(false),

  isNewArrival: z.boolean().optional().default(false),
});

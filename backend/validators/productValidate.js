import { z } from "zod";

export const productValidationSchema = z.object({
  categoryId: z
    .string({
      required_error: "Category is required",
      invalid_type_error: "Category ID must be a string",
    })
    // MongoDB ObjectId format validation
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format"),

  name: z
    .string({
      required_error: "Product name is required",
    })
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .max(200, "Product name cannot exceed 200 characters"),

  slug: z
    .string({
      required_error: "Slug is required",
    })
    .trim()
    .toLowerCase()
    .min(1, "Slug is required"),

  description: z
    .string({
      required_error: "Product description is required",
    })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  brand: z.string().trim().optional().default(""),

  // 🔥 IMAGE SCHEMA UPDATED HERE 🔥
  images: z.object({
    desktop: z
      .array(
        z.string({
          invalid_type_error: "Desktop image URL must be a string",
        }),
      )
      .min(1, "Please provide at least one desktop image."), // Mandatory

    tablet: z
      .array(
        z.string({
          invalid_type_error: "Tablet image URL must be a string",
        }),
      )
      .optional()
      .default([]), // Optional with default empty array

    mobile: z
      .array(
        z.string({
          invalid_type_error: "Mobile image URL must be a string",
        }),
      )
      .optional()
      .default([]), // Optional with default empty array
  }),

  price: z
    .number({
      required_error: "Product price is required",
      invalid_type_error: "Price must be a number",
    })
    .min(0, "Price cannot be negative"),

  discountPrice: z
    .number({
      invalid_type_error: "Discount price must be a number",
    })
    .min(0, "Discount price cannot be negative")
    .nullable()
    .optional()
    .default(null),

  sku: z
    .string({
      required_error: "SKU is required",
    })
    .trim()
    .toUpperCase() // Mongoose ke uppercase: true ke liye
    .min(1, "SKU is required"),

  stock: z
    .number({
      required_error: "Stock is required",
      invalid_type_error: "Stock must be a number",
    })
    .min(0, "Stock cannot be negative")
    .optional()
    .default(0),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional()
    .default(true),

  averageRating: z.number().optional().default(0),

  numOfReviews: z.number().optional().default(0),
});

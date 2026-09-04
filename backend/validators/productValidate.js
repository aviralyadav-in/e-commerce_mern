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

  // Sub-category multi-select - input kisi bhi shape me aa sakta hai:
  // JSON string '["Men","Women"]', plain "Men", comma-separated "Men,Women"
  // ya direct array. Sab normalize karke array banao.
  subCategory: z
    .preprocess((val) => {
      if (val === undefined) return val; // .optional()/.default() handle karenge
      if (val === null || val === "") return ["Men"]; // khali value - default
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        const trimmed = val.trim();
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // JSON nahi hai - plain / comma-separated string
        }
        return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
      }
      return val;
    }, z.array(
      z.enum(["Men", "Women"], {
        error: "Sub-category must be Men or Women",
      }),
    ).min(1, "Select at least one sub-category (Men or Women)"))
    .optional()
    .default(["Men"]),

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

  // 🆕 Collections — Collections section (categories) ke ObjectId strings.
  // FormData me JSON string array aata hai; controller parse karta hai.
  collections: z
    .array(
      z
        .string({ error: "Collection ID must be a string" })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid Collection ID format"),
    )
    .optional()
    .default([]),

  // 🆕 Color variants — optional array; har variant me name required,
  // images optional (admin product images bhi use kar sakta hai).
  variants: z
    .array(
      z.object({
        name: z
          .string({ error: "Variant name is required" })
          .trim()
          .min(1, "Variant name is required")
          .max(60, "Variant name cannot exceed 60 characters"),
        images: z
          .array(z.string({ error: "Variant image must be a string" }))
          .optional()
          .default([]),
      }),
    )
    .max(10, "Maximum 10 variants allowed")
    .optional()
    .default([]),
});

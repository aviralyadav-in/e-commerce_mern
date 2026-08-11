import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters")
    .max(150, "Product name cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  price: z.coerce.number().min(0, "Price cannot be negative"),

  category: z.string().trim().regex(objectIdRegex, "Invalid category id"),

  images: z
    .union([z.string().trim(), z.array(z.string().trim())])
    .optional()
    .transform((value) => {
      if (!value) return [];
      return typeof value === "string" ? [value] : value;
    }),

  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .default(0),

  status: z
    .enum(["active", "draft", "inactive"], {
      errorMap: () => ({
        message: "Invalid product status. Must be active, draft, or inactive",
      }),
    })
    .optional()
    .default("active"),
});

export const getProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  sort: z.enum(["name", "price", "createdAt", "stock"]).default("createdAt"),

  order: z.enum(["asc", "desc"]).default("desc"),

  category: z
    .string()
    .trim()
    .regex(objectIdRegex, "Invalid category id")
    .optional(),

  minPrice: z.coerce.number().min(0).optional(),

  maxPrice: z.coerce.number().min(0).optional(),

  search: z.string().trim().optional(),

  status: z.enum(["active", "draft", "inactive"]).optional(),
});

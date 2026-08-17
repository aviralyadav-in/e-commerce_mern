import { z } from "zod";

export const categoryValidationSchema = z.object({
  name: z
    .string({
      required_error: "Category name is required",
      invalid_type_error: "Category name must be a string",
    })
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  slug: z
    .string({
      required_error: "Slug is required",
    })
    .trim()
    .toLowerCase()
    .min(1, "Slug is required"), // Taaki empty string pass na ho

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional() // Optional isliye kyunki database me default value hai
    .default(""),

  image: z.string().optional().default(""),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional()
    .default(true),
});

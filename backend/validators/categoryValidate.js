import { z } from "zod";
import { genderArraySchema } from "./genderSchema.js";

export const categoryValidationSchema = z.object({
  name: z
    .string({
      error: "Category name is required",
    })
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  slug: z
    .string({
      error: "Slug is required",
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

  // FormData me JSON string '["Men","Women"]' aata hai — schema array bana deta hai
  gender: genderArraySchema(["Men", "Women"]),

  isActive: z
    .boolean({
      error: "isActive must be a boolean",
    })
    .optional()
    .default(true),

  // 🆕 Hierarchy — parent category (optional; "" ya null = top-level).
  parentId: z
    .preprocess((val) => {
      if (val === "" || val === "null" || val === "undefined") return null;
      return val;
    }, z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid parent category ID").nullable().optional()),

  // 🆕 Hierarchy manager — existing category ko is category ke under
  // child banane ke liye (controller re-parent + cycle-guard karta hai).
  childId: z
    .preprocess((val) => {
      if (val === "" || val === "null" || val === "undefined") return null;
      return val;
    }, z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid child category ID").nullable().optional()),
});

/* =========================================================
   🆕 REUSABLE HIERARCHY SCHEMAS
   - createCategorySchema: full payload (FormData-safe coercion)
   - updateCategorySchema: partial (PUT /admin/:id)
   - Depth/circular rules controller me enforce hote hain
   (DB reads chahiye isliye Zod me nahi)
========================================================= */
export const createCategorySchema = categoryValidationSchema.extend({
  sortOrder: z.coerce
    .number({ error: "Sort order must be a number" })
    .int("Sort order must be an integer")
    .min(0, "Sort order cannot be negative")
    .max(9999, "Sort order cannot exceed 9999")
    .optional()
    .default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

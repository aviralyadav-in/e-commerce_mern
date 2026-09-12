import { z } from "zod";

export const baseCollectionSchema = z.object({
  name: z
    .string({ error: "Collection name is required" })
    .trim()
    .min(2, "Collection name must be at least 2 characters")
    .max(100, "Collection name cannot exceed 100 characters"),

  slug: z
    .string({ error: "Slug is required" })
    .trim()
    .toLowerCase()
    .min(1, "Slug is required"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  image: z.string().optional(),

  isActive: z.boolean().optional(),

  // 🆕 Home page "Featured Pieces" curation
  showOnHomePage: z
    .boolean({ error: "showOnHomePage must be a boolean" })
    .optional(),

  // 🆕 Dynamic shop badge — product cards par collection naam ka badge
  showAsBadge: z
    .boolean({ error: "showAsBadge must be a boolean" })
    .optional(),
});

export const collectionValidationSchema = baseCollectionSchema.extend({
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),

  image: z.string().optional().default(""),

  isActive: z.boolean().optional().default(true),

  showOnHomePage: z
    .boolean({ error: "showOnHomePage must be a boolean" })
    .optional()
    .default(false),

  showAsBadge: z
    .boolean({ error: "showAsBadge must be a boolean" })
    .optional()
    .default(false),
});

export const updateCollectionSchema = baseCollectionSchema.partial();

/* =========================================================
   🆕 BULK ADD PRODUCTS — products table bulk action
   { collectionId, productIds[] } → products.collections array
========================================================= */
export const bulkAddProductsSchema = z.object({
  collectionId: z
    .string({ error: "Collection ID is required" })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid collection ID"),

  productIds: z
    .array(
      z
        .string({ error: "Product ID must be a string" })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
      { error: "productIds must be an array" },
    )
    .min(1, "Select at least one product"),
});

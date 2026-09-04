import { z } from "zod";

const ruleSchema = z.object({
  field: z.enum(["price", "stock", "createdAt", "subCategory"], {
    error: "Invalid rule field",
  }),
  operator: z.enum(["gt", "gte", "lt", "lte", "eq", "withinDays"], {
    error: "Invalid rule operator",
  }),
  value: z.union([z.string(), z.number()], {
    error: "Rule value is required",
  }),
});

export const collectionValidationSchema = z.object({
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
    .optional()
    .default(""),

  image: z.string().optional().default(""),

  // manual = products khud link karo, automated = rules se auto-membership
  type: z.enum(["manual", "automated"]).optional().default("manual"),

  // sirf automated collections ke liye
  rules: z.array(ruleSchema).optional().default([]),

  isActive: z.boolean().optional().default(true),

  // 🆕 Home page "Featured Pieces" curation
  showOnHomePage: z
    .boolean({ error: "showOnHomePage must be a boolean" })
    .optional()
    .default(false),

  // 🆕 Dynamic shop badge — product cards par collection naam ka badge
  showAsBadge: z
    .boolean({ error: "showAsBadge must be a boolean" })
    .optional()
    .default(false),
});

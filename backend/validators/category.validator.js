import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .default(""),

  image: z.string().trim().optional().default(""),
  status: z
    .enum(["active", "inactive"], {
      errorMap: () => ({ message: "Status must be either active or inactive" }),
    })
    .optional()
    .default("active"),
});

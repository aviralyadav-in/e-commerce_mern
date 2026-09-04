import { z } from "zod";

export const couponValidationSchema = z.object({
  code: z
    .string({
      error: "Coupon code is required",
    })
    .trim()
    .toUpperCase(),

  discountType: z.enum(["percentage", "flat"], {
    error: "Discount type must be either 'percentage' or 'flat'",
  }),

  discountValue: z
    .number({
      error: "Discount value is required and must be a number",
    })
    .min(0, "Discount value cannot be negative"),

  minOrderValue: z
    .number({
      error: "Minimum order value must be a number",
    })
    .min(0, "Minimum order value cannot be negative")
    .optional()
    .default(0),

  expiryDate: z.coerce.date({
    error: "Expiry date is required and must be a valid date",
  }),

  isActive: z
    .boolean({
      error: "isActive must be a boolean",
    })
    .optional()
    .default(true),

  // Optional limits — null/absent = unlimited
  usageLimit: z
    .number({ error: "Usage limit must be a number" })
    .int("Usage limit must be a whole number")
    .min(1, "Usage limit must be at least 1")
    .nullable()
    .optional()
    .default(null),

  perUserLimit: z
    .number({ error: "Per-user limit must be a number" })
    .int("Per-user limit must be a whole number")
    .min(1, "Per-user limit must be at least 1")
    .nullable()
    .optional()
    .default(null),
});

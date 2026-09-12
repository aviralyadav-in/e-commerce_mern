import { z } from "zod";

export const baseCouponSchema = z
  .object({
    code: z
      .string({
        error: "Coupon code is required",
      })
      .trim()
      .min(3, "Coupon code must be at least 3 characters")
      .max(30, "Coupon code cannot exceed 30 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Coupon code can only contain letters, numbers, hyphens, and underscores",
      )
      .toUpperCase(),

    discountType: z.enum(["percentage", "flat"], {
      error: "Discount type must be either 'percentage' or 'flat'",
    }),

    discountValue: z
      .number({
        error: "Discount value is required and must be a number",
      })
      .gt(0, "Discount value must be greater than 0"),

    minOrderValue: z
      .number({
        error: "Minimum order value must be a number",
      })
      .min(0, "Minimum order value cannot be negative")
      .optional(),

    expiryDate: z.coerce.date({
      error: "Expiry date is required and must be a valid date",
    }),

    isActive: z
      .boolean({
        error: "isActive must be a boolean",
      })
      .optional(),

    usageLimit: z
      .number({ error: "Usage limit must be a number" })
      .int("Usage limit must be a whole number")
      .min(1, "Usage limit must be at least 1")
      .nullable()
      .optional(),

    perUserLimit: z
      .number({ error: "Per-user limit must be a number" })
      .int("Per-user limit must be a whole number")
      .min(1, "Per-user limit must be at least 1")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      data.discountValue === undefined ||
      data.discountValue <= 100,
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) =>
      data.discountType !== "flat" ||
      !data.minOrderValue ||
      data.discountValue === undefined ||
      data.minOrderValue >= data.discountValue,
    {
      message: "Minimum order value must be at least equal to flat discount amount",
      path: ["minOrderValue"],
    },
  )
  .refine(
    (data) =>
      !data.usageLimit ||
      !data.perUserLimit ||
      data.perUserLimit <= data.usageLimit,
    {
      message: "Per-user limit cannot exceed total usage limit",
      path: ["perUserLimit"],
    },
  );

// For CREATE: attach defaults for optional fields
export const couponValidationSchema = baseCouponSchema.and(
  z.object({
    minOrderValue: z.number().optional().default(0),
    isActive: z.boolean().optional().default(true),
    usageLimit: z.number().nullable().optional().default(null),
    perUserLimit: z.number().nullable().optional().default(null),
  }),
);

// For UPDATE: partial without default leakage
export const updateCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Coupon code must be at least 3 characters")
      .max(30, "Coupon code cannot exceed 30 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Coupon code can only contain letters, numbers, hyphens, and underscores",
      )
      .toUpperCase()
      .optional(),
    discountType: z.enum(["percentage", "flat"]).optional(),
    discountValue: z
      .number()
      .gt(0, "Discount value must be greater than 0")
      .optional(),
    minOrderValue: z
      .number()
      .min(0, "Minimum order value cannot be negative")
      .optional(),
    expiryDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    perUserLimit: z.number().int().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      data.discountValue === undefined ||
      data.discountValue <= 100,
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) =>
      data.discountType !== "flat" ||
      !data.minOrderValue ||
      data.discountValue === undefined ||
      data.minOrderValue >= data.discountValue,
    {
      message: "Minimum order value must be at least equal to flat discount amount",
      path: ["minOrderValue"],
    },
  )
  .refine(
    (data) =>
      !data.usageLimit ||
      !data.perUserLimit ||
      data.perUserLimit <= data.usageLimit,
    {
      message: "Per-user limit cannot exceed total usage limit",
      path: ["perUserLimit"],
    },
  );

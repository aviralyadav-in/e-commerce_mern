import { z } from "zod";

export const couponValidationSchema = z.object({
  code: z
    .string({
      required_error: "Coupon code is required",
      invalid_type_error: "Coupon code must be a string",
    })
    .trim()
    .toUpperCase(),

  discountType: z.enum(["percentage", "flat"], {
    required_error: "Discount type is required",
    invalid_type_error: "Discount type must be either 'percentage' or 'flat'",
  }),

  discountValue: z
    .number({
      required_error: "Discount value is required",
      invalid_type_error: "Discount value must be a number",
    })
    .min(0, "Discount value cannot be negative"),

  minOrderValue: z
    .number({
      invalid_type_error: "Minimum order value must be a number",
    })
    .min(0, "Minimum order value cannot be negative")
    .optional()
    .default(0),

  expiryDate: z.coerce.date({
    required_error: "Expiry date is required",
    invalid_type_error: "Invalid expiry date format",
  }),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional()
    .default(true),
});

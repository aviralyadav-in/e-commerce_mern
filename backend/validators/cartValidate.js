import { z } from "zod";

// MongoDB ObjectId ke liye reusable validator
const objectIdValidation = z
  .string({ error: "ObjectId is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

// Cart ke andar 'items' array ka schema
const cartItemSchema = z.object({
  product: objectIdValidation,
  // 🆕 Variant snapshot — null/undefined = plain product (no variant)
  variantName: z
    .string({ error: "Variant name must be a string" })
    .trim()
    .max(60, "Variant name cannot exceed 60 characters")
    .nullable()
    .optional(),
  quantity: z
    .number({ error: "Quantity is required and must be a number" })
    .int("Quantity must be an integer")
    .min(1, "Quantity cannot be less than 1")
    .default(1),
  price: z
    .number({ error: "Price is required and must be a number" })
    .min(0, "Price cannot be negative"),
});

// Main Cart Validation Schema
export const cartValidationSchema = z.object({
  user: objectIdValidation,
  items: z.array(cartItemSchema).default([]),
  totalPrice: z.number().default(0),
  couponApplied: objectIdValidation.nullable().default(null),
  discountAmount: z.number().default(0),
  totalAmountAfterDiscount: z.number().default(0),
});

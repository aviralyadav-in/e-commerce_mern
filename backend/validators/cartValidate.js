import { z } from "zod";

// MongoDB ObjectId ke liye reusable validator
const objectIdValidation = z
  .string({ required_error: "ObjectId is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

// Cart ke andar 'items' array ka schema
const cartItemSchema = z.object({
  product: objectIdValidation,
  quantity: z
    .number({ required_error: "Quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity cannot be less than 1")
    .default(1),
  price: z
    .number({ required_error: "Price is required" })
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

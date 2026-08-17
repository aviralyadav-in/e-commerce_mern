import { z } from "zod";

// MongoDB ObjectId validator
const objectIdValidation = z
  .string({ required_error: "ObjectId is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

// Single Order Item Schema
const orderItemSchema = z.object({
  product: objectIdValidation,
  quantity: z
    .number({ required_error: "Quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
  price: z
    .number({ required_error: "Price is required" })
    .min(0, "Price cannot be negative"),
});

// Main Order Validation Schema
export const orderValidationSchema = z.object({
  user: objectIdValidation,
  shippingAddress: objectIdValidation,
  orderItems: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item"),
  itemsPrice: z.number().min(0).default(0),
  shippingPrice: z.number().min(0).default(0),
  couponCode: z.string().nullable().optional().default(null),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["COD", "Card", "UPI"], {
    errorMap: () => ({ message: "Payment method must be COD, Card, or UPI" }),
  }),
  paymentStatus: z
    .enum(["Pending", "Completed", "Failed", "Refunded"])
    .default("Pending"),
  transactionId: z.string().optional(),
  orderStatus: z
    .enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"])
    .default("Pending"),
  deliveredAt: z.coerce.date().optional(),
});

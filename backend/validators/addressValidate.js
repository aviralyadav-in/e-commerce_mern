import { z } from "zod";

export const addressValidationSchema = z.object({
  customer: z
    .string({
      required_error: "Customer ID is required",
      invalid_type_error: "Customer ID must be a string",
    })
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Customer ID format"),

  full_name: z
    .string({
      required_error: "Please provide the receiver name",
    })
    .trim()
    .min(1, "Please provide the receiver name"),

  phone: z
    .string({
      required_error: "Please provide a contact number for delivery",
    })
    // Mongoose schema ka match regex exactly yahan use kiya hai
    .regex(/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"),

  street: z
    .string({
      required_error: "Please provide street address/House No.",
    })
    .trim()
    .min(1, "Please provide street address/House No."),

  city: z
    .string({
      required_error: "City is required",
    })
    .trim()
    .min(1, "City is required"),

  state: z
    .string({
      required_error: "State is required",
    })
    .trim()
    .min(1, "State is required"),

  pincode: z
    .string({
      required_error: "Pincode is required",
    })
    // Mongoose schema ka match regex
    .regex(/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"),

  is_default: z
    .boolean({
      invalid_type_error: "is_default must be a boolean",
    })
    .optional()
    .default(false),
});

import { z } from "zod";

export const userValidationSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),

  email: z
    .string({
      required_error: "Email is required",
    })
    .trim()
    .toLowerCase()
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please enter a valid email",
    ),

  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters"),

  phone: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((val) => val === "" || /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid Indian phone number",
    }),

  avatar: z.string().optional().default(""),

  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"], {
      errorMap: () => ({ message: "Invalid gender value" }),
    })
    .default("prefer_not_to_say"),

  dateOfBirth: z.coerce.date().nullable().optional().default(null),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"), // Yahan min 8 check karne ki zarurat nahi, sirf ye check karna hai ki empty na ho
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .optional(),

  phone: z
    .string()
    .trim()
    .refine((val) => val === "" || /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid Indian phone number",
    })
    .optional(),

  avatar: z.string().optional(),

  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),

  dateOfBirth: z.coerce.date().nullable().optional(),
});

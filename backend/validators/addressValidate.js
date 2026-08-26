import { z } from "zod";

// Mongoose address.model.js ke regex — bilkul same yahan bhi
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// Forms khali box bhejte hain ("" / null) — unhe undefined treat karo taaki
// optional fields par regex validators fail na hon
const emptyToUndefined = (value) =>
  value === "" || value === null ? undefined : value;

const optionalText = (maxLen, message) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLen, message).optional(),
  );

export const addressValidationSchema = z.object({
  // 👤 Personal Details
  firstName: z
    .string({ error: "First name is required" })
    .trim()
    .min(1, "First name is required")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string({ error: "Last name is required" })
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name cannot exceed 50 characters"),

  // 📞 Contact Details
  phone: z
    .string({ error: "Phone number is required" })
    .trim()
    .regex(
      INDIAN_PHONE_REGEX,
      "Please enter a valid 10-digit Indian mobile number",
    ),

  alternatePhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(INDIAN_PHONE_REGEX, "Please enter a valid 10-digit mobile number")
      .optional(),
  ),

  email: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toLowerCase()
      .regex(EMAIL_REGEX, "Please enter a valid email address")
      .optional(),
  ),

  // 🏠 Address Details
  addressLine1: z
    .string({ error: "Address line 1 is required" })
    .trim()
    .min(1, "Address line 1 is required")
    .max(255, "Address line 1 cannot exceed 255 characters"),

  addressLine2: optionalText(255, "Address line 2 cannot exceed 255 characters"),

  landmark: optionalText(100, "Landmark cannot exceed 100 characters"),

  city: z
    .string({ error: "City is required" })
    .trim()
    .min(1, "City is required")
    .max(50, "City name cannot exceed 50 characters"),

  state: z
    .string({ error: "State is required" })
    .trim()
    .min(1, "State is required")
    .max(50, "State name cannot exceed 50 characters"),

  // Mongoose default 'India' apply karega jab na bheja jaye
  country: optionalText(50, "Country name cannot exceed 50 characters"),

  zipCode: z
    .string({ error: "Pincode is required" })
    .trim()
    .regex(INDIAN_PINCODE_REGEX, "Please enter a valid 6-digit Indian Pincode"),

  // 🏷️ Utility Fields
  addressType: z
    .enum(["HOME", "WORK", "OTHER"], {
      error: "Address type must be HOME, WORK or OTHER",
    })
    .default("HOME"),

  addressNickname: optionalText(30, "Nickname cannot exceed 30 characters"),

  isDefault: z
    .boolean({ error: "isDefault must be a boolean" })
    .default(false),
});

// Update ke liye partial schema (sirf changed fields bhejne par validate ho)
export const addressUpdateValidationSchema =
  addressValidationSchema.partial();


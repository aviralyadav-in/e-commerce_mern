import { z } from "zod";

export const adminValidationSchema = z.object({
  name: z
    .string({
      required_error: "Admin name is required",
      invalid_type_error: "Admin name must be a string",
    })
    .trim()
    // Zod me string default taur par empty ("") ho sakti hai,
    // isliye min(1) lagana zaroori hai taki empty spaces pass na ho jayein.
    .min(1, "Admin name is required"),

  email: z
    .string({
      required_error: "Admin email is required",
    })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email format"), // Mongoose me regex nahi tha, par email ke liye ye best practice hai

  password: z
    .string({
      required_error: "Admin password is required",
    })
    .min(1, "Admin password is required"),

  role: z.string().optional().default("SuperAdmin"),
});

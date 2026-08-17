import { z } from "zod";

export const bannerValidationSchema = z.object({
  title: z
    .string({
      required_error: "Banner title is required",
      invalid_type_error: "Banner title must be a string",
    })
    .trim()
    .min(1, "Banner title is required") // Taaki khali space pass na ho
    .max(100, "Title cannot exceed 100 characters"),

  subtitle: z
    .string({
      invalid_type_error: "Subtitle must be a string",
    })
    .trim()
    .max(200, "Subtitle cannot exceed 200 characters")
    .optional()
    .default(""),

  image: z
    .string({
      required_error: "Banner image is required",
      invalid_type_error: "Banner image URL/path must be a string",
    })
    .min(1, "Banner image is required"),

  linkUrl: z
    .string({
      invalid_type_error: "Link URL must be a string",
    })
    .trim()
    .optional()
    .default(""),

  // Form-data (multer) se data aane par numbers string ban jate hain,
  // isliye z.coerce.number() use karna best hai taaki wo automatically number me convert ho jaye.
  sortOrder: z.coerce
    .number({
      invalid_type_error: "Sort order must be a number",
    })
    .optional()
    .default(0),

  isActive: z
    .boolean({
      invalid_type_error: "isActive must be a boolean",
    })
    .optional()
    .default(true),
});

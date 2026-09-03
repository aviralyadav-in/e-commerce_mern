import { z } from "zod";

export const bannerValidationSchema = z.object({
  title: z
    .string({
      error: "Banner title is required",
    })
    .trim()
    .min(1, "Banner title is required") // Taaki khali space pass na ho
    .max(100, "Title cannot exceed 100 characters"),

  subtitle: z
    .string({
      error: "Subtitle must be a string",
    })
    .trim()
    .max(200, "Subtitle cannot exceed 200 characters")
    .optional()
    .default(""),

  image: z
    .string({
      error: "Banner image is required",
    })
    .min(1, "Banner image is required"),

  linkUrl: z
    .string({
      error: "Link URL must be a string",
    })
    .trim()
    .optional()
    .default(""),

  // Form-data (multer) se data aane par numbers string ban jate hain,
  // isliye z.coerce.number() use karna best hai taaki wo automatically number me convert ho jaye.
  sortOrder: z.coerce
    .number({
      error: "Sort order must be a number",
    })
    .optional()
    .default(0),

  isActive: z
    .boolean({
      error: "isActive must be a boolean",
    })
    .optional()
    .default(true),

  // 🆕 Multi-page promo — kis page par, kahan dikhe
  page: z
    .enum(["home", "shop", "wishlist"], {
      error: "Page must be home, shop, or wishlist",
    })
    .optional()
    .default("home"),

  position: z
    .enum(["after-hero", "after-products"], {
      error: "Position must be after-hero or after-products",
    })
    .optional()
    .default("after-hero"),
});

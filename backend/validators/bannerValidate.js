import { z } from "zod";

export const baseBannerSchema = z.object({
  title: z
    .string({
      error: "Banner title is required",
    })
    .trim()
    .min(1, "Banner title is required")
    .max(100, "Title cannot exceed 100 characters"),

  subtitle: z
    .string({
      error: "Subtitle must be a string",
    })
    .trim()
    .max(200, "Subtitle cannot exceed 200 characters")
    .optional(),

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
    .optional(),

  sortOrder: z.coerce
    .number({
      error: "Sort order must be a number",
    })
    .min(0, "Sort order cannot be negative")
    .optional(),

  isActive: z
    .boolean({
      error: "isActive must be a boolean",
    })
    .optional(),

  page: z
    .enum(["home", "shop", "wishlist"], {
      error: "Page must be home, shop, or wishlist",
    })
    .optional(),

  position: z
    .enum(["after-hero", "after-products"], {
      error: "Position must be after-hero or after-products",
    })
    .optional(),
});

// Full schema with defaults for creation
export const bannerValidationSchema = baseBannerSchema.extend({
  subtitle: baseBannerSchema.shape.subtitle.default(""),
  linkUrl: baseBannerSchema.shape.linkUrl.default(""),
  sortOrder: baseBannerSchema.shape.sortOrder.default(0),
  isActive: baseBannerSchema.shape.isActive.default(true),
  page: baseBannerSchema.shape.page.default("home"),
  position: baseBannerSchema.shape.position.default("after-hero"),
});

// Partial schema WITHOUT defaults for clean updates
export const updateBannerSchema = baseBannerSchema.partial();

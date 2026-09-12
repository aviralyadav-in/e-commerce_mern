import mongoose from "mongoose";
import { Banner } from "../models/banner.model.js";
import {
  bannerValidationSchema,
  updateBannerSchema,
} from "../validators/bannerValidate.js";
import { deleteFile as deleteFromCloudinary } from "../utils/storage.js";

/* =========================================================
   1. CREATE BANNER
========================================================= */
export const createBanner = async (req, res) => {
  try {
    // 1. Form-Data boolean parsing
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // 2. Image sirf Multer upload se aati hai — body me bheji koi bhi URL string
    // ignore (warna banner delete/replace par us URL ka asset Cloudinary se hat jata)
    req.body.image = req.file ? req.file.path : undefined;

    // 3. Zod Validation
    const result = bannerValidationSchema.safeParse(req.body);

    if (!result.success) {
      // Validation fail hui toh nayi uploaded file delete karein
      if (req.file) await deleteFromCloudinary(req.file.path);

      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    // 4. Create Banner in DB (Zod se filtered data lein)
    const banner = await Banner.create(result.data);

    return res.status(201).json({
      message: "Banner created successfully",
      banner,
    });
  } catch (error) {
    console.error("Create Banner Error:", error);
    if (req.file)
      await deleteFromCloudinary(req.file.path);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET ALL BANNERS
========================================================= */
export const getBanners = async (req, res) => {
  try {
    // 🆕 Optional page filter — ?page=shop ya ?page=wishlist
    // 🔒 FIX (Public API): Default me sirf ACTIVE banners dikhate hain —
    // storefront hidden banner nahi dekh sakta.
    // Admin panel ?all=true bhejta hai taaki inactive banners bhi manage ho sakein.
    const { page, all } = req.query;
    const filter =
      page && ["home", "shop", "wishlist"].includes(String(page))
        ? { page: String(page) }
        : {};

    if (String(all) !== "true") {
      filter.isActive = true;
    }

    // Fix: Banners ko pehle 'sortOrder' se (1, 2, 3), uske baad naye banners (createdAt) ke hisab se sort kiya hai
    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });

    return res.status(200).json({
      message: "Banners fetched successfully",
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Get Banners Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. GET BANNER BY ID
========================================================= */
export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid banner ID" });
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({
      message: "Banner fetched successfully",
      banner,
    });
  } catch (error) {
    console.error("Get Banner By ID Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. UPDATE BANNER
========================================================= */
export const updateBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    // 🛠️ Invalid ObjectId → 400 (cast error 500 nahi)
    if (!mongoose.Types.ObjectId.isValid(bannerId)) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "Invalid banner ID" });
    }

    // Check if banner exists before updating
    const existingBanner = await Banner.findById(bannerId);
    if (!existingBanner) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Banner not found" });
    }

    // Form-Data boolean parsing
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // Image sirf nayi file upload se update hoti hai — body ki string ignore
    delete req.body.image;
    if (req.file) {
      req.body.image = req.file.path;
    }

    // Use updateBannerSchema (no default injection)
    const result = updateBannerSchema.safeParse(req.body);

    if (!result.success) {
      if (req.file) await deleteFromCloudinary(req.file.path);
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    // 🛠️ DEFAULT-LEAK GUARD — Sirf wahi fields update karo jo request me bheji gayi
    const updateData = {};
    Object.keys(result.data).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = result.data[key];
    });

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    // Agar nayi image aayi thi aur data update ho gaya, toh purani server se delete kar do
    if (
      req.file &&
      existingBanner.image &&
      updatedBanner.image !== existingBanner.image
    ) {
      await deleteFromCloudinary(existingBanner.image);
    }

    return res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);
    if (req.file)
      await deleteFromCloudinary(req.file.path);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. DELETE BANNER
========================================================= */
export const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(bannerId)) {
      return res.status(400).json({ message: "Invalid banner ID" });
    }

    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Delete from DB
    await Banner.findByIdAndDelete(bannerId);

    // Sath me image file bhi Cloudinary se delete karo
    if (banner.image) {
      await deleteFromCloudinary(banner.image);
    }

    return res.status(200).json({
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   6. 🆕 TOGGLE BANNER STATUS (Admin Only)
   PATCH /api/banners/:id/toggle-status
========================================================= */
export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid banner ID" });
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json({
      message: `Banner status changed to ${banner.isActive ? "Active" : "Inactive"}`,
      banner,
    });
  } catch (error) {
    console.error("Toggle Banner Status Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

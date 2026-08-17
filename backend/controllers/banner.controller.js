import fs from "fs/promises";
import path from "path";
import { Banner } from "../models/banner.model.js";
import { bannerValidationSchema } from "../validators/bannerValidate.js";

/* =========================================================
   HELPER FUNCTION (Local File Delete Karne Ke Liye)
========================================================= */
const deleteImageFile = async (imagePath) => {
  if (!imagePath) return;
  if (imagePath.startsWith("http")) return; // External URL ko skip karein

  try {
    const filePath = path.join(process.cwd(), imagePath.replace(/^\/+/, ""));
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Delete Image File Error:", error);
    }
  }
};

/* =========================================================
   1. CREATE BANNER
========================================================= */
export const createBanner = async (req, res) => {
  try {
    // 1. Form-Data boolean parsing
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // 2. Multer se aayi image ko req.body.image me inject karein
    if (req.file) {
      req.body.image = `/uploads/banners/${req.file.filename}`; // Path apne hisab se adjust kar lena
    }

    // 3. Zod Validation
    const result = bannerValidationSchema.safeParse(req.body);

    if (!result.success) {
      // Validation fail hui toh nayi uploaded file delete karein
      if (req.file) await deleteImageFile(req.body.image);

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
      await deleteImageFile(`/uploads/banners/${req.file.filename}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET ALL BANNERS
========================================================= */
export const getBanners = async (req, res) => {
  try {
    // Fix: Banners ko pehle 'sortOrder' se (1, 2, 3), uske baad naye banners (createdAt) ke hisab se sort kiya hai
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });

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
    const banner = await Banner.findById(req.params.id);

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

    // Check if banner exists before updating
    const existingBanner = await Banner.findById(bannerId);
    if (!existingBanner) {
      if (req.file)
        await deleteImageFile(`/uploads/banners/${req.file.filename}`);
      return res.status(404).json({ message: "Banner not found" });
    }

    // Form-Data boolean parsing
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // Agar update me nayi file upload hui hai, toh path set karein
    if (req.file) {
      req.body.image = `/uploads/banners/${req.file.filename}`;
    }

    // Use .partial() kyuki update me saari fields bhejni zaruri nahi
    const result = bannerValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      if (req.file) await deleteImageFile(req.body.image);
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: result.data },
      { new: true, runValidators: true },
    );

    // Agar nayi image aayi thi aur data update ho gaya, toh purani server se delete kar do
    if (
      req.file &&
      existingBanner.image &&
      updatedBanner.image !== existingBanner.image
    ) {
      await deleteImageFile(existingBanner.image);
    }

    return res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);
    if (req.file)
      await deleteImageFile(`/uploads/banners/${req.file.filename}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. DELETE BANNER
========================================================= */
export const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Delete from DB
    await Banner.findByIdAndDelete(bannerId);

    // Sath me local image file bhi delete karo
    if (banner.image) {
      await deleteImageFile(banner.image);
    }

    return res.status(200).json({
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

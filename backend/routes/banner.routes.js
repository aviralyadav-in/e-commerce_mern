import express from "express";
import {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "../controllers/banner.controller.js";
import { adminRoute } from "../middleware/admin.middleware.js";

// 🔥 Yahan default 'upload' ki jagah 'bannerUpload' import karein
import { bannerUpload } from "../middleware/upload.middleware.js";

const bannerRouter = express.Router();

bannerRouter.get("/", getBanners);
// 🔥 Ab yahan bannerUpload.single("image") lagayein
bannerRouter.post("/", adminRoute, bannerUpload.single("image"), createBanner);
bannerRouter.get("/:id", adminRoute, getBannerById);
bannerRouter.put(
  "/:id",
  adminRoute,
  bannerUpload.single("image"),
  updateBanner,
);
bannerRouter.delete("/:id", adminRoute, deleteBanner);

export default bannerRouter;

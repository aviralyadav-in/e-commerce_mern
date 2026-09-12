import express from "express";
import {
  login,
  adminLogin,
  adminLogout,
  getAdminMe,
  signup,
  logout,
  getProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";
import { avatarUploadWithErrorHandling } from "../middleware/upload.middleware.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/admin/login", adminLogin);
authRouter.get("/admin/me", adminRoute, getAdminMe);
authRouter.post("/admin/logout", adminLogout);
// Public — expired/invalid token par bhi cookie clear ho sake
authRouter.post("/logout", logout);
authRouter.get("/profile", protectedRoute, getProfile);
// 🛠️ REST standard: partial update ke liye PATCH. Controller already
// partial-update semantics implement karta hai (sirf bheji hui fields
// update hoti hain), isliye PUT route hata diya gaya
authRouter.patch("/profile", protectedRoute, updateProfile);

// 🆕 Profile photo upload / remove
authRouter.put(
  "/profile/avatar",
  protectedRoute,
  avatarUploadWithErrorHandling,
  updateAvatar,
);
authRouter.delete("/profile/avatar", protectedRoute, removeAvatar);

export default authRouter;

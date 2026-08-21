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
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/admin/login", adminLogin);
authRouter.get("/admin/me", adminRoute, getAdminMe);
authRouter.post("/admin/logout", adminLogout);
authRouter.post("/logout", protectedRoute, logout);
authRouter.get("/profile", protectedRoute, getProfile);
authRouter.put("/profile", protectedRoute, updateProfile);

export default authRouter;

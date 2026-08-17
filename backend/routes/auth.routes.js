import express from "express";
import {
  login,
  adminLogin,
  signup,
  logout,
  getProfile,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/admin/login", adminLogin);
authRouter.post("/logout", protectedRoute, logout);
authRouter.get("/profile", protectedRoute, getProfile);
authRouter.put("/profile", protectedRoute, updateProfile);

export default authRouter;

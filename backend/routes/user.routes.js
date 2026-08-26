import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserAvatar,
  removeUserAvatar,
} from "../controllers/user.controller.js";
import { adminRoute } from "../middleware/admin.middleware.js";
import { avatarUpload } from "../middleware/upload.middleware.js";

const userRouter = express.Router();

userRouter.get("/admin", adminRoute, getAllUsers);
userRouter.get("/admin/:id", adminRoute, getUserById);
userRouter.post("/admin", adminRoute, createUser);
userRouter.put("/admin/:id", adminRoute, updateUser);
userRouter.put("/admin/:id/avatar", adminRoute, avatarUpload.single("avatar"), updateUserAvatar);
userRouter.delete("/admin/:id/avatar", adminRoute, removeUserAvatar);
userRouter.delete("/admin/:id", adminRoute, deleteUser);

export default userRouter;

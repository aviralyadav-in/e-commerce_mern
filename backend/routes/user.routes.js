import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const userRouter = express.Router();

userRouter.get("/admin", adminRoute, getAllUsers);
userRouter.get("/admin/:id", adminRoute, getUserById);
userRouter.post("/admin", adminRoute, createUser);
userRouter.put("/admin/:id", adminRoute, updateUser);
userRouter.delete("/admin/:id", adminRoute, deleteUser);

export default userRouter;

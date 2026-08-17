import express from "express";
import { getAllUsers } from "../controllers/user.controller.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const userRouter = express.Router();

userRouter.get("/admin", adminRoute, getAllUsers);

export default userRouter;

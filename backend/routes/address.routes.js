import express from "express";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

// Hamesha yaad rakhein ki address sirf logged-in user apna hi manage kar sakta hai
import { protectedRoute } from "../middleware/auth.middleware.js";

const addressRouter = express.Router();

// Route par middleware lagana
addressRouter.use(protectedRoute);

// Address Routes
addressRouter.post("/", createAddress);
addressRouter.get("/", getUserAddresses);
addressRouter.get("/:id", getAddressById);
addressRouter.put("/:id", updateAddress);
addressRouter.delete("/:id", deleteAddress);

export default addressRouter;

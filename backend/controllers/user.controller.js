import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import {
  userValidationSchema,
  adminUpdateUserSchema,
} from "../validators/userValidate.js";

/* =========================================================
   GET ALL USERS (Admin)
========================================================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   GET USER BY ID (Admin)
========================================================= */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get User By Id Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   CREATE USER (Admin)
========================================================= */
export const createUser = async (req, res) => {
  try {
    const result = userValidationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, phone, avatar, gender, dateOfBirth } =
      result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      avatar: avatar || "",
      gender,
      dateOfBirth: dateOfBirth || null,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: "User created successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Create User Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   UPDATE USER (Admin)
========================================================= */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = adminUpdateUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const updateData = { ...result.data };

    // Email uniqueness check (other users)
    if (updateData.email && updateData.email !== user.email) {
      const emailTaken = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });
      if (emailTaken) {
        return res.status(409).json({ message: "Email already registered" });
      }
    }

    // Password optional — only hash if provided
    if (updateData.password) {
      const salt = await bcryptjs.genSalt(10);
      updateData.password = await bcryptjs.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   DELETE USER (Admin)
========================================================= */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Related cart / wishlist clean up (orders & reviews history rehne do)
    await Promise.all([
      Cart.deleteMany({ user: id }),
      Wishlist.deleteMany({ user: id }),
    ]);

    return res.status(200).json({
      message: "User deleted successfully",
      userId: id,
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

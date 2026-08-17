import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"; // Aapke path ke hisab se
import {
  loginSchema,
  updateProfileSchema,
  userValidationSchema,
} from "../validators/userValidate.js";

// ==========================================
// 1. SIGNUP CONTROLLER
// ==========================================
export const signup = async (req, res) => {
  try {
    // Zod Validation
    const result = userValidationSchema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    // Corrected fields according to your schema
    const { name, email, password, phone, avatar, gender, dateOfBirth } =
      result.data;

    // Check only Email (Kyunki schema me sirf email unique hai, username nahi hai)
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user with matching schema fields
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      avatar,
      gender,
      dateOfBirth,
    });

    // JWT sign (Schema me role nahi tha, isliye hata diya gaya)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Password ko response se hide karne ke liye
    user.password = undefined;

    return res.status(201).json({
      message: "User registered successfully",
      user: user,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==========================================
// 2. LOGIN CONTROLLER
// ==========================================
export const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    const { email, password } = result.data;

    // IMPORTANT FIX: .select("+password") zaroori hai kyunki schema me select: false hai
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Response me password na bheje
    user.password = undefined;

    return res.status(200).json({
      message: "Login successful",
      user: user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==========================================
// 3. ADMIN LOGIN CONTROLLER
// ==========================================
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin model se find karenge
    const { Admin } = await import("../models/admin.model.js");
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin email or password" });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, admin.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid admin email or password" });
    }

    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    admin.password = undefined;

    return res.status(200).json({
      message: "Admin login successful",
      user: admin,
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==========================================
// 4. LOGOUT CONTROLLER
// ==========================================
export const logout = async (req, res) => {
  try {
    // FIX: req.user could be undefined if admin logged out via this route
    const name = req.user?.name || "User";

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: `${name} Logged out successfully`,
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==========================================
// 4. GET PROFILE CONTROLLER
// ==========================================
export const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Profile fetched successfully",
      user: req.user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==========================================
// 5. UPDATE PROFILE CONTROLLER
// ==========================================
export const updateProfile = async (req, res) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    // FIX: Schema ke hisab se exact fields extract kiye
    const { name, email, phone, avatar, gender, dateOfBirth } = result.data;
    const userId = req.user._id;

    // Email check if user is updating email
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email already registered to another user" });
      }
    }

    const updateData = {};
    // Sirf wahi fields update karenge jo req.body me aaye hain
    // FIX: undefined check use karna chahiye, falsy check nahi — warna empty string ("") ya null set nahi hoga
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

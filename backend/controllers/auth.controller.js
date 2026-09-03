import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { User } from "../models/user.model.js"; // Aapke path ke hisab se
import {
  loginSchema,
  updateProfileSchema,
  userValidationSchema,
} from "../validators/userValidate.js";

/* ==========================================
   🔐 AUTH COOKIE OPTIONS (single source of truth)
   - secure flag .env se control hota hai:
     development → COOKIE_SECURE=false (HTTP chalega)
     production  → COOKIE_SECURE=true  (HTTPS ke liye ZAROORI)
   - Saare set/clear cookie calls isi helper se options lete hain,
     taaki kabhi ek jagah change karke doosri jagah miss na ho
========================================== */
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

const authCookieOptions = (withMaxAge = false) => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "lax",
  path: "/",
  ...(withMaxAge ? { maxAge: SEVEN_DAYS } : {}),
});

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

    res.cookie("token", token, authCookieOptions(true));

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

    res.cookie("token", token, authCookieOptions(true));

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
      return res
        .status(401)
        .json({ message: "Invalid admin email or password" });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, admin.password);

    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: "Invalid admin email or password" });
    }

    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 🛠️ FIX: Admin ka JWT alag cookie naam ('adminToken') me — warna yahi
    // cookie storefront ke 'token' ko overwrite karke usse logout kar deti thi
    res.cookie("adminToken", token, authCookieOptions(true));

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
// 3b. GET CURRENT ADMIN (cookie se)
// ==========================================
export const getAdminMe = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Admin session active",
      user: req.admin,
    });
  } catch (error) {
    console.error("Get Admin Me Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ==========================================
// 3c. ADMIN LOGOUT (cookie clear)
// ==========================================
export const adminLogout = async (req, res) => {
  try {
    // 🛠️ FIX: sirf admin wali cookie clear karo — user ka 'token' safe rahe
    res.clearCookie("adminToken", authCookieOptions());

    return res.status(200).json({
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("Admin Logout Error:", error);
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

    res.clearCookie("token", authCookieOptions());

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
    // (avatar yahan intentionally NAHI hai — wo sirf dedicated
    //  PUT /profile/avatar upload endpoint se update hota hai)
    const { name, email, phone, gender, dateOfBirth } = result.data;
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
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================
   🆕 LOCAL FILE CLEANUP HELPER (avatar ke liye)
   External (http) URLs ko skip karta hai
========================================== */
// 🛡️ Security root — sirf is folder ke andar ki files hi delete ho sakti hain
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

const deleteLocalFile = async (imagePath) => {
  if (!imagePath || imagePath.startsWith("http")) return;
  try {
    const filePath = path.resolve(
      process.cwd(),
      imagePath.replace(/^\/+/, ""),
    );

    // 🛡️ Path traversal guard — kabhi uploads/ ke bahar delete na ho
    if (!filePath.startsWith(UPLOADS_ROOT + path.sep)) {
      console.warn("Blocked avatar delete outside uploads dir:", imagePath);
      return;
    }

    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Delete Avatar File Error:", error);
    }
  }
};

/* ==========================================
   🆕 UPDATE AVATAR (profile photo upload)
   multipart/form-data → field: 'avatar'
   Purani local photo delete karke nayi set hoti hai
========================================== */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Avatar image is required (form field: 'avatar')",
      });
    }

    const newAvatarPath = `/uploads/avatars/${req.file.filename}`;
    const userId = req.user._id;

    // ⚡ Optimized: sirf 'avatar' field fetch hoti hai (poora document nahi)
    const oldUser = await User.findById(userId).select("avatar");
    if (!oldUser) {
      // User exist nahi karta — bina orphan file chhode clean karo
      await deleteLocalFile(newAvatarPath);
      return res.status(404).json({ message: "User not found" });
    }

    // ⚡ Atomic update — findById + save() ka full-document overhead nahi
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: newAvatarPath } },
      { returnDocument: "after" },
    );

    if (!updatedUser) {
      await deleteLocalFile(newAvatarPath);
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Correct order: DB update hone ke BAAD purani file delete karo.
    //    - DB update fail ho jaye → user ki purani photo bachi rehti hai
    //    - File delete fail ho jaye → sirf orphan file bachi hai (chhoti problem)
    //    (Pehle file pehle delete hoti thi — save fail hone par photo chali jaati)
    await deleteLocalFile(oldUser.avatar);

    return res.status(200).json({
      message: "Profile photo updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Avatar Error:", error);
    // Upload hui file agar DB save fail ho jaye to clean karo
    if (req.file) {
      await deleteLocalFile(`/uploads/avatars/${req.file.filename}`);
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================
   🆕 REMOVE AVATAR (photo hatana)
========================================== */
export const removeAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    // ⚡ Optimized: sirf avatar field chahiye
    const oldUser = await User.findById(userId).select("avatar");
    if (!oldUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ⚡ Early return: avatar pehle se empty hai to useless DB write nahi
    if (!oldUser.avatar) {
      return res.status(200).json({
        message: "No profile photo to remove",
        user: req.user,
      });
    }

    // ⚡ Atomic update — ek hi query me avatar clear
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: "" } },
      { returnDocument: "after" },
    );

    // ✅ DB safe hone ke baad hi file delete karo
    await deleteLocalFile(oldUser.avatar);

    return res.status(200).json({
      message: "Profile photo removed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Remove Avatar Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

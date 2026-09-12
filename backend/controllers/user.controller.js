import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { Address } from "../models/address.model.js";
import {
  userValidationSchema,
  adminUpdateUserSchema,
} from "../validators/userValidate.js";
import { csvToObjects } from "../utils/csvParser.js";
import { deleteFile as deleteFromCloudinary } from "../utils/storage.js";
import { splitByModelValidation } from "../utils/validateDoc.js";

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

    const addresses = await Address.find({ user: id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({ user, addresses });
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
      // 🛠️ Photo ke saath create — validation fail par uploaded file clean
      if (req.file) {
        await deleteFromCloudinary(req.file.path);
      }
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, phone, gender, dateOfBirth } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // 🛠️ Email conflict par bhi uploaded photo clean karo
      if (req.file) {
        await deleteFromCloudinary(req.file.path);
      }
      return res.status(409).json({ message: "Email already registered" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      // 🆕 Photo ke saath create — Cloudinary url
      avatar: req.file ? req.file.path : "",
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
    if (req.file) {
      await deleteFromCloudinary(req.file.path);
    }
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
      { returnDocument: "after", runValidators: true },
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

    // Related cart / wishlist / addresses clean up (orders & reviews history rehne do)
    await Promise.all([
      Cart.deleteMany({ user: id }),
      Wishlist.deleteMany({ user: id }),
      Address.deleteMany({ user: id }),
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

/* ==========================================
   🆕 UPDATE USER AVATAR (Admin)
   multipart/form-data → field: 'avatar'
========================================== */
export const updateUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) {
        await deleteFromCloudinary(req.file.path);
      }
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Avatar image is required (form field: 'avatar')" });
    }

    const user = await User.findById(id);
    if (!user) {
      await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Pehle DB save — save fail ho toh purani photo preserve rehti hai
    const oldAvatar = user.avatar;
    user.avatar = req.file.path;
    await user.save();

    // ✅ DB safe hone ke baad hi purani file delete karo
    if (oldAvatar && oldAvatar !== user.avatar) {
      await deleteFromCloudinary(oldAvatar);
    }

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({
      message: "Avatar updated successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Update User Avatar Error:", error);
    if (req.file) {
      await deleteFromCloudinary(req.file.path);
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ==========================================
   🆕 REMOVE USER AVATAR (Admin)
========================================== */
export const removeUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Pehle DB save — fail hone par purani file preserve rehti hai
    const oldAvatar = user.avatar;
    user.avatar = "";
    await user.save();

    // ✅ DB safe hone ke baad hi file delete karo
    if (oldAvatar) {
      await deleteFromCloudinary(oldAvatar);
    }

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({
      message: "Avatar removed successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Remove User Avatar Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   🆕 BULK CREATE USERS / CUSTOMERS (Admin CSV Import)
   POST /api/users/admin/bulk — multipart/form-data (file: CSV)
========================================================= */
const MAX_USER_ROWS = 500;

export const bulkCreateUsers = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Please upload a CSV file" });
    }

    const rawText = req.file.buffer.toString("utf-8");
    const rows = csvToObjects(rawText);

    if (!rows.length) {
      return res
        .status(400)
        .json({ message: "CSV is empty or has no data rows" });
    }

    if (!("name" in rows[0]) || !("email" in rows[0]) || !("password" in rows[0])) {
      return res.status(400).json({
        message:
          "Invalid CSV format — header row must include 'name', 'email' and 'password' (optional: phone, gender, dateOfBirth)",
      });
    }

    if (rows.length > MAX_USER_ROWS) {
      return res.status(400).json({
        message: `Too many rows — maximum ${MAX_USER_ROWS} per file`,
      });
    }

    // Existing emails in DB
    const existingUsers = await User.find({}).select("email").lean();
    const existingEmails = new Set(
      existingUsers.map((u) => (u.email || "").toLowerCase()),
    );
    const seenEmails = new Set();

    const docs = [];
    const invalidRows = [];
    const duplicates = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 2;
      const name = (row.name || "").trim();
      const email = (row.email || "").trim().toLowerCase();

      const fail = (error, duplicate = false) =>
        (duplicate ? duplicates : invalidRows).push({
          row: rowNo,
          name: name ? `${name} (${email || "No email"})` : `Row ${rowNo}`,
          error,
        });

      if (!name) {
        fail("'name' is required");
        continue;
      }
      if (!email) {
        fail("'email' is required");
        continue;
      }

      // Duplicate check
      if (existingEmails.has(email) || seenEmails.has(email)) {
        fail(`Customer with email '${email}' already exists`, true);
        continue;
      }

      // 🔒 Password har row me zaroori — koi shared default password nahi
      // (source code me likha default ho toh email jaanne wala koi bhi login kar leta)
      if (!row.password) {
        fail("'password' is required (min 8 characters)");
        continue;
      }

      // Wahi Zod rules jo admin "Add customer" form use karta hai — drift na ho
      const result = userValidationSchema.safeParse({
        name,
        email,
        password: row.password,
        phone: row.phone ?? row["phone_number"] ?? row["mobile"] ?? "",
        gender: (row.gender || "").toLowerCase() || undefined,
        dateOfBirth: row.dateofbirth ?? row["date_of_birth"] ?? row["dob"] ?? "",
      });
      if (!result.success) {
        const issue = result.error.issues[0];
        fail(
          issue.path[0] === "dateOfBirth"
            ? "Date of birth must be a valid date (e.g. YYYY-MM-DD)"
            : issue.message,
        );
        continue;
      }

      // Hash password
      const salt = await bcryptjs.genSalt(10);
      const doc = {
        ...result.data,
        password: await bcryptjs.hash(result.data.password, salt),
        avatar: "",
      };

      seenEmails.add(email);
      docs.push({ row: rowNo, name: `${name} (${email})`, doc });
    }

    // Model rules — insertMany ordered:false invalid docs chupchaap drop kar deta
    const { validDocs, invalidRows: modelInvalidRows } =
      await splitByModelValidation(User, docs);
    invalidRows.push(...modelInvalidRows);
    invalidRows.sort((a, b) => a.row - b.row);

    let inserted = [];
    if (validDocs.length) {
      inserted = await User.insertMany(validDocs, { ordered: false });
    }

    // Password remove karein response ke liye
    const safeUsers = inserted.map((u) => {
      const obj = u.toObject();
      delete obj.password;
      return obj;
    });

    return res.status(200).json({
      message: `Bulk upload complete — ${inserted.length} created, ${duplicates.length} duplicates skipped, ${invalidRows.length} invalid rows`,
      totalRows: rows.length,
      insertedCount: inserted.length,
      skippedDuplicates: duplicates.length,
      invalidRowCount: invalidRows.length,
      invalidRows,
      duplicates,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Bulk Create Users Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


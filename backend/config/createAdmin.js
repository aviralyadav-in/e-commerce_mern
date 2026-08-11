import bcryptjs from "bcryptjs";
import { User } from "../models/user.model.js";

export const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin already exists — skipping");
      return;
    }

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log("Admin credentials not found in .env — skipping");
      return;
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, salt);

    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`Admin created successfully: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Create Admin Error:", error);
  }
};

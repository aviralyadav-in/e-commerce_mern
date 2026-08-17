import bcryptjs from "bcryptjs";
import { Admin } from "../models/admin.model.js";
import { adminValidationSchema } from "./../validators/adminValidate.js";

export const createAdmin = async () => {
  try {
    // 1. Ab User collection ki jagah Admin collection me check karenge
    // Aapke schema me default role 'SuperAdmin' hai
    const adminExists = await Admin.findOne({ role: "SuperAdmin" });

    if (adminExists) {
      console.log("Admin already exists — skipping");
      return;
    }

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log("Admin credentials not found in .env — skipping");
      return;
    }

    // 2. .env se aayi values ko Zod se validate karna (Best Practice)
    const result = adminValidationSchema.safeParse({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      // role dene ki zarurat nahi, Zod default 'SuperAdmin' laga dega
    });

    if (!result.success) {
      console.error(
        "Admin validation failed (Check your .env values):",
        result.error.flatten().fieldErrors,
      );
      return;
    }

    const { name, email, password, role } = result.data;

    // 3. Password hash karein
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // 4. Naye Admin collection me data save karein
    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role, // Ye schema ke hisab se "SuperAdmin" hoga
    });

    console.log(`Admin created successfully: ${email}`);
  } catch (error) {
    console.error("Create Admin Error:", error);
  }
};

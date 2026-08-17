import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";

export const adminRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Ya aap req.cookies.adminToken use kar sakte hain agar admin ka token alag naam se save karaya hai

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized, please login as admin first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Dhyan de: Ye Admin model me dhoondh raha hai
    const admin = await Admin.findById(decoded.userId).select("-password");

    if (!admin) {
      return res.status(403).json({
        message: "Access denied, admin only",
      });
    }

    // Aapke admin schema me role default 'SuperAdmin' hai
    if (admin.role !== "SuperAdmin") {
      return res.status(403).json({
        message: "Access denied, insufficient permissions",
      });
    }

    req.admin = admin; // req.admin set kar diya taaki confusion na ho
    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error);

    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Unauthorized, invalid or expired admin token",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

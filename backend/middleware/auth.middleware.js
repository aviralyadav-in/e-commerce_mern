import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Sirf customer 'token' cookie + User model. Admin ka 'adminToken' alag
// adminRoute me verify hota hai — dono sessions kabhi mix nahi hote
// (warna cart/orders/reviews me user ki jagah Admin id save ho jaati).
export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const token = req.cookies.token || bearerToken;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized, please login first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Unauthorized, invalid or expired token",
      });
    }

    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

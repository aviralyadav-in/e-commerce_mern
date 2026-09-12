// Server entry point - local uploads enabled
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { createAdmin } from "./config/createAdmin.js";
import { uploadErrorHandler } from "./middleware/upload.middleware.js";
import { runDataMigrations } from "./config/migrations.js";

// ✅ Sabhi Routers ko yahan import kiya gaya hai
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/category.routes.js";
import collectionRouter from "./routes/collection.routes.js";
import productRouter from "./routes/product.routes.js";
import addressRouter from "./routes/address.routes.js";
import bannerRouter from "./routes/banner.routes.js";
import cartRouter from "./routes/cart.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import orderRouter from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import inquiryRouter from "./routes/inquiry.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const parsedUrl = new URL(origin);
        const hostname = parsedUrl.hostname;
        const isLocalhost = ["localhost", "127.0.0.1"].includes(hostname);
        const isLocalNetwork =
          hostname.startsWith("192.168.") ||
          hostname.startsWith("10.") ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

        const configuredOrigins = [
          process.env.FRONTEND_URL,
          process.env.ADMIN_URL,
        ]
          .filter(Boolean)
          .flatMap((u) => u.split(",").map((s) => s.trim().toLowerCase()));

        if (
          isLocalhost ||
          isLocalNetwork ||
          configuredOrigins.includes(origin.toLowerCase()) ||
          configuredOrigins.includes(parsedUrl.origin.toLowerCase())
        ) {
          callback(null, origin);
          return;
        }
      } catch (error) {
        callback(new Error("Not allowed by CORS"));
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(cookieParser());

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Sabhi API Routes ko Express app mein register kiya gaya hai
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/products", productRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/cart", cartRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/inquiries", inquiryRouter);

// Base Route
app.get("/", (req, res) => {
  res.send("Ecommerce Backend API is Running");
});

// Upload errors (Multer / Cloudinary) → clean 400/502, baaki global handler ko
app.use(uploadErrorHandler);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Server Initialization
const startServer = async () => {
  try {
    await connectDB();

    // Purana data naye schema shape me (idempotent). Fail ho toh log karke
    // server chalu rehta hai — agli restart par dobara try hoga
    try {
      await runDataMigrations();
    } catch (migrationError) {
      console.error("Data Migration Error:", migrationError);
    }

    await createAdmin();

    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
};

startServer();

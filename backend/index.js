import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { createAdmin } from "./config/createAdmin.js";

// ✅ Sabhi Routers ko yahan import kiya gaya hai
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import categoryRouter from "./routes/category.routes.js";
import productRouter from "./routes/product.routes.js";
import addressRouter from "./routes/address.routes.js";
import bannerRouter from "./routes/banner.routes.js";
import cartRouter from "./routes/cart.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import orderRouter from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";

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
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

app.use(cookieParser());

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Sabhi API Routes ko Express app mein register kiya gaya hai
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/cart", cartRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);

// Base Route
app.get("/", (req, res) => {
  res.send("Ecommerce Backend API is Running");
});

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
    await createAdmin();

    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
};

startServer();

import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    // Total times this coupon can be used across all users (null = unlimited)
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },
    // Max times a single user can use this coupon (null = unlimited)
    perUserLimit: {
      type: Number,
      default: null,
      min: [1, "Per-user limit must be at least 1"],
    },
    // Successful redemptions — abuse-proofing ke liye
    usedCount: {
      type: Number,
      default: 0,
    },
    // Per-user tracking — kaun kitni baar use kar chuka
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 1,
        },
      },
    ],
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Coupon = mongoose.model("Coupon", couponSchema);

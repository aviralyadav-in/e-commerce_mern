import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required for an order"],
      index: true, // Frontend pe "My Orders" page ko super-fast load karne ke liye
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "shipped", "delivered", "cancelled"],
        message: "{VALUE} is not a valid order status",
      },
      default: "pending",
      index: true, // Admin Panel me "Pending Orders" ya "Shipped Orders" ko jaldi filter karne ke liye
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "failed", "refunded"], // 'refunded' add kiya hai order cancel hone ke case ke liye
        message: "{VALUE} is not a valid payment status",
      },
      default: "pending",
    },

    shippingAddress: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ createdAt: -1, status: 1 });

export const Order = mongoose.model("Order", orderSchema);

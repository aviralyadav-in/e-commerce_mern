import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    full_name: {
      type: String,
      required: [true, "Please provide the receiver name"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide a contact number for delivery"],
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    street: {
      type: String,
      required: [true, "Please provide street address/House No."],
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
      match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"],
    },
    is_default: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Address = mongoose.model("Address", addressSchema);

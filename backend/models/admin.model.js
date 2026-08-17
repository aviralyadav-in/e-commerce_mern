import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Admin password is required"],
      select: false,
    },
    role: {
      type: String,
      default: "SuperAdmin",
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Admin = mongoose.model("Admin", adminSchema);

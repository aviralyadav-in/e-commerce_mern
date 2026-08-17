import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          if (v === "") return true;
          return /^[6-9]\d{9}$/.test(v);
        },
        message: "Please enter a valid Indian phone number",
      },
    },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other", "prefer_not_to_say"],
        message: "Invalid gender value",
      },
      default: "prefer_not_to_say",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Sirf createdAt aur updatedAt ke liye
  },
);

// Indexes for faster lookups
userSchema.index({ phone: 1 });

export const User = mongoose.model("User", userSchema);

import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    // 🔗 User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // 👤 Personal Details (B2C - Individual Customer)
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    // 📞 Contact Details (Delivery ke liye critical)
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit Indian mobile number",
      ],
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: undefined,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    // 🏠 Address Details
    addressLine1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
      maxlength: [255, "Address line 1 cannot exceed 255 characters"],
    },
    addressLine2: {
      type: String,
      trim: true,
      default: undefined,
      maxlength: [255, "Address line 2 cannot exceed 255 characters"],
    },
    landmark: {
      type: String,
      trim: true,
      default: undefined,
      maxlength: [100, "Landmark cannot exceed 100 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [50, "City name cannot exceed 50 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [50, "State name cannot exceed 50 characters"],
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian Pincode"],
      index: true,
    },

    // 🏷️ Utility Fields (B2C Convenience)
    addressType: {
      type: String,
      enum: {
        values: ["HOME", "WORK", "OTHER"],
        message: "Address type must be HOME, WORK or OTHER",
      },
      default: "HOME",
    },
    addressNickname: {
      type: String,
      trim: true,
      default: undefined,
      maxlength: [30, "Nickname cannot exceed 30 characters"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 🚨 CRITICAL: Ensure ONLY ONE default address per user (save par)
addressSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      {
        user: this.user,
        _id: { $ne: this._id },
      },
      {
        $set: { isDefault: false },
      },
    );
  }
  next();
});

// For findOneAndUpdate operations — $set-wrapped ya flat update dono handle karo
addressSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() || {};
    const payload = update.$set ?? update;

    if (payload.isDefault === true) {
      // Query se document nikalo (query sirf _id ho, ye zaroori nahi)
      const doc = await this.model.findOne(this.getQuery()).select("user _id");
      if (doc) {
        await this.model.updateMany(
          {
            user: doc.user,
            _id: { $ne: doc._id },
          },
          {
            $set: { isDefault: false },
          },
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for full name (toJSON/toObject virtuals enabled — API responses me milega)
addressSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Indexes for performance
// (zipCode par field-level `index: true` already hai — duplicate yahan nahi lagate)
addressSchema.index({ user: 1, isDefault: 1 });

// Named + Default dono exports (controllers named use karte hain)
export const Address = mongoose.model("Address", addressSchema);
export default Address;


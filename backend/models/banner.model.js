import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
      default: "",
    },
    // Banner ki image (local storage path)
    image: {
      type: String,
      required: [true, "Banner image is required"],
    },
    // Click karne par user kis page/product par jaye (Optional CTA Link)
    linkUrl: {
      type: String,
      default: "",
    },
    // Admin multiple banners dal sakta hai, toh order set karne ke liye (1, 2, 3...)
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Admin chahe toh banner ko temporary hide ya show kar sakta hai
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Banner = mongoose.model("Banner", bannerSchema);

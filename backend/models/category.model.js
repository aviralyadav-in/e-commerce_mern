import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    // Men / Women genders under this category
    gender: {
      type: [
        {
          type: String,
          enum: ["Men", "Women"],
        },
      ],
      default: ["Men", "Women"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "Select at least one gender (Men or Women).",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🆕 Hierarchy — parent category (jaise Bags under Men). Null = top-level.
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // 🆕 Manual ordering — chhota number pehle dikhega (admin tree + list)
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, "Sort order cannot be negative"],
    },

    // 🆕 Hierarchy meta — computed fields (parent change par controller
    // recompute karta hai). level: 0 = root, 1 = child, 2 = sub-child.
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },
    // Materialized path — "rootId/childId/selfId" — fast tree building,
    // breadcrumbs aur descendant queries ke liye.
    path: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// 🆕 Parent-based tree queries fast karne ke liye
categorySchema.index({ parentId: 1 });

export const Category = mongoose.model("Category", categorySchema);

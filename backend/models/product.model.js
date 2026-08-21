import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
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
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },

    // Men / Women / Unisex under parent category
    subCategory: {
      type: String,
      enum: {
        values: ["Men", "Women", "Unisex"],
        message: "Sub-category must be Men, Women, or Unisex",
      },
      default: "Unisex",
    },

    // 🔥 IMAGE SCHEMA UPDATED HERE 🔥
    images: {
      desktop: {
        type: [String],
        validate: [
          {
            validator: function (val) {
              return val.length > 0;
            },
            message: "Please provide at least one desktop image.",
          },
        ],
      },
      mobile: {
        type: [String],
        default: [],
      },
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative"],
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      required: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Product = mongoose.model("Product", productSchema);

import mongoose from "mongoose";

// 🆕 COLLECTIONS — marketing/curation entity (Categories se bilkul alag).
// Categories = catalog structure (hierarchy), Collections = marketing groups
// (manual picks — products admin khud link karta hai) — Shopify jaisa separation.
// Sab collections manual hain — products admin khud link karta hai.
const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Collection name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Collection name must be at least 2 characters"],
      maxlength: [100, "Collection name cannot exceed 100 characters"],
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
    isActive: {
      type: Boolean,
      default: true,
    },
    // 🆕 Home page curation — is collection ke products home ke
    // "Featured Pieces" section me dikhenge
    showOnHomePage: {
      type: Boolean,
      default: false,
    },
    // 🆕 Dynamic shop badge — is collection me member products ke cards par
    // collection ka naam badge ke roop me dikhega
    showAsBadge: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Collection = mongoose.model("Collection", collectionSchema);

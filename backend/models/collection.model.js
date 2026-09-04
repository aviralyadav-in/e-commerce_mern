import mongoose from "mongoose";

// 🆕 Automated collection ke rules — har rule ek condition hai jaise
// price > 5000 ya createdAt 30 din ke andar.
const ruleSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      enum: ["price", "stock", "createdAt", "subCategory"],
      required: true,
    },
    operator: {
      type: String,
      enum: ["gt", "gte", "lt", "lte", "eq", "withinDays"],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

// 🆕 COLLECTIONS — marketing/curation entity (Categories se bilkul alag).
// Categories = catalog structure (hierarchy), Collections = marketing groups
// (manual picks ya automated rules) — Shopify jaisa separation.
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
    // manual = admin khud products link karta hai
    // automated = rules match hone par products automatically member
    type: {
      type: String,
      enum: ["manual", "automated"],
      default: "manual",
    },
    // sirf automated collections ke liye — membership rules
    rules: {
      type: [ruleSchema],
      default: [],
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

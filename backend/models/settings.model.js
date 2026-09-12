import mongoose from "mongoose";

const SETTINGS_KEY = "store";

const settingsSchema = new mongoose.Schema(
  {
    // 🔒 Singleton guard — unique key ki wajah se DB me sirf ek settings
    // document ban sakta hai (sparse: key se pehle bane purane docs allowed)
    key: {
      type: String,
      default: SETTINGS_KEY,
      unique: true,
      sparse: true,
    },
    storeName: {
      type: String,
      default: "Niya Bags",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "support@niyabags.com",
      trim: true,
      lowercase: true,
    },
    supportPhone: {
      type: String,
      default: "9876543210",
      trim: true,
    },
    storeAddress: {
      type: String,
      default: "Bandra West, Mumbai, Maharashtra 400050",
      trim: true,
    },
    gstin: {
      type: String,
      default: "27AAACN1234F1Z5",
      trim: true,
      uppercase: true,
    },
    freeShippingThreshold: {
      type: Number,
      default: 500,
      min: [0, "Threshold cannot be negative"],
    },
    shippingFee: {
      type: Number,
      default: 50,
      min: [0, "Shipping fee cannot be negative"],
    },
    codEnabled: {
      type: Boolean,
      default: true,
    },
    codFee: {
      type: Number,
      default: 0,
      min: [0, "COD fee cannot be negative"],
    },
    estimatedDeliveryDays: {
      type: String,
      default: "3-5 business days",
      trim: true,
    },
    announcementText: {
      type: String,
      default: "✨ Free shipping on all orders of ₹500 and above across India!",
      trim: true,
    },
    announcementEnabled: {
      type: Boolean,
      default: true,
    },
    socialLinks: {
      instagram: {
        type: String,
        default: "https://instagram.com/niyabags",
      },
      facebook: {
        type: String,
        default: "https://facebook.com/niyabags",
      },
      twitter: {
        type: String,
        default: "https://twitter.com/niyabags",
      },
      youtube: {
        type: String,
        default: "https://youtube.com/@niyabags",
      },
      whatsapp: {
        type: String,
        default: "+91 98765 43210",
      },
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Race-safe get-or-create — hamesha wahi ek settings document.
 * Key se pehle bana purana document ho toh usi ko adopt karta hai (settings lost na hon).
 */
settingsSchema.statics.getSingleton = async function getSingleton() {
  try {
    const existing = await this.findOne({ key: SETTINGS_KEY });
    if (existing) return existing;

    const legacy = await this.findOneAndUpdate(
      { key: { $exists: false } },
      { $set: { key: SETTINGS_KEY } },
      { sort: { createdAt: 1 }, returnDocument: "after" },
    );
    if (legacy) return legacy;

    return await this.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $setOnInsert: { key: SETTINGS_KEY } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  } catch (error) {
    // Parallel request ne usi waqt document bana diya — wahi return karo
    if (error?.code === 11000) return this.findOne({ key: SETTINGS_KEY });
    throw error;
  }
};

export const Settings = mongoose.model("Settings", settingsSchema);

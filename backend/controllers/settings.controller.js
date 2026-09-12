import { Settings } from "../models/settings.model.js";

/* =========================================================
   GET SETTINGS (Public & Admin)
   Always returns the singleton settings document.
========================================================= */
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    return res.status(200).json({
      message: "Settings fetched successfully",
      settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   UPDATE SETTINGS (Admin Only)
========================================================= */
export const updateSettings = async (req, res) => {
  try {
    const {
      storeName,
      supportEmail,
      supportPhone,
      storeAddress,
      gstin,
      freeShippingThreshold,
      shippingFee,
      codEnabled,
      codFee,
      estimatedDeliveryDays,
      announcementText,
      announcementEnabled,
      socialLinks,
    } = req.body;

    const settings = await Settings.getSingleton();

    // 1. Store Brand Name Validation
    if (storeName !== undefined) {
      const cleanStoreName = String(storeName).trim();
      if (!cleanStoreName || cleanStoreName.length < 2) {
        return res.status(400).json({
          message: "Store brand name is required (minimum 2 characters)",
        });
      }
      settings.storeName = cleanStoreName;
    }

    // 2. Support Email Validation
    if (supportEmail !== undefined) {
      const cleanEmail = String(supportEmail).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          message: "Please provide a valid customer support email address",
        });
      }
      settings.supportEmail = cleanEmail;
    }

    // 3. Support Phone Validation
    if (supportPhone !== undefined) {
      const cleanPhone = String(supportPhone).trim();
      const digitsOnly = cleanPhone.replace(/\D/g, "");
      if (cleanPhone && digitsOnly.length < 10) {
        return res.status(400).json({
          message: "Please provide a valid Indian support phone number (at least 10 digits)",
        });
      }
      settings.supportPhone = cleanPhone;
    }

    // 4. Store Address
    if (storeAddress !== undefined) {
      settings.storeAddress = String(storeAddress).trim();
    }

    // 5. GSTIN Tax Number Validation
    if (gstin !== undefined) {
      const cleanGstin = String(gstin).trim().toUpperCase();
      if (cleanGstin) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(cleanGstin)) {
          return res.status(400).json({
            message:
              "Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 27AAACN1234F1Z5)",
          });
        }
      }
      settings.gstin = cleanGstin;
    }

    // 6. Free Shipping Threshold Validation
    if (freeShippingThreshold !== undefined) {
      const thresholdNum = Number(freeShippingThreshold);
      if (isNaN(thresholdNum) || thresholdNum < 0) {
        return res.status(400).json({
          message: "Free shipping minimum order value must be a valid number (>= 0)",
        });
      }
      settings.freeShippingThreshold = thresholdNum;
    }

    // 7. Standard Shipping Fee Validation
    if (shippingFee !== undefined) {
      const feeNum = Number(shippingFee);
      if (isNaN(feeNum) || feeNum < 0) {
        return res.status(400).json({
          message: "Standard shipping fee must be a valid number (>= 0)",
        });
      }
      settings.shippingFee = feeNum;
    }

    // 8. COD Enabled & Fee
    if (codEnabled !== undefined) {
      settings.codEnabled = Boolean(codEnabled);
    }
    if (codFee !== undefined) {
      const codFeeNum = Number(codFee);
      if (isNaN(codFeeNum) || codFeeNum < 0) {
        return res.status(400).json({
          message: "COD convenience fee must be a valid number (>= 0)",
        });
      }
      settings.codFee = codFeeNum;
    }

    // 9. Delivery Days
    if (estimatedDeliveryDays !== undefined) {
      settings.estimatedDeliveryDays = String(estimatedDeliveryDays).trim();
    }

    // 10. Announcement Banner
    if (announcementEnabled !== undefined) {
      settings.announcementEnabled = Boolean(announcementEnabled);
    }
    if (announcementText !== undefined) {
      const cleanBanner = String(announcementText).trim();
      if (settings.announcementEnabled && !cleanBanner) {
        return res.status(400).json({
          message: "Announcement banner text is required when the banner is enabled",
        });
      }
      settings.announcementText = cleanBanner;
    }

    // 11. Social Links URL Validation
    if (socialLinks !== undefined && typeof socialLinks === "object") {
      const urlFields = ["instagram", "facebook", "twitter", "youtube"];
      for (const field of urlFields) {
        if (socialLinks[field]) {
          const val = String(socialLinks[field]).trim();
          if (val && !val.startsWith("http://") && !val.startsWith("https://")) {
            return res.status(400).json({
              message: `${field.charAt(0).toUpperCase() + field.slice(1)} URL must start with http:// or https://`,
            });
          }
        }
      }
      if (!settings.socialLinks) settings.socialLinks = {};
      for (const [key, val] of Object.entries(socialLinks)) {
        if (typeof val === "string") {
          settings.socialLinks[key] = val.trim();
        }
      }
    }

    await settings.save();

    return res.status(200).json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   RESET SETTINGS TO DEFAULTS (Admin Only)
========================================================= */
export const resetSettings = async (req, res) => {
  try {
    await Settings.deleteMany({});
    const settings = await Settings.getSingleton();
    return res.status(200).json({
      message: "Store settings reset to recommended defaults successfully",
      settings,
    });
  } catch (error) {
    console.error("Reset Settings Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

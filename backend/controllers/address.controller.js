import mongoose from "mongoose";
import { Address } from "../models/address.model.js";
import { addressValidationSchema } from "../validators/addressValidate.js"; // Zod schema

/* =========================================================
   HELPERS
========================================================= */
// Form-data se aaye "true"/"false" strings ko boolean me convert karo
const normalizeIsDefault = (body = {}) => {
  if (body.isDefault === "true") body.isDefault = true;
  if (body.isDefault === "false") body.isDefault = false;
};

const formatZodErrors = (zodError) => zodError.flatten().fieldErrors;

// Current address ko chhodkar baaki sabhi defaults hata do (single-default rule)
const clearOtherDefaults = async (userId, excludeId = null) => {
  const query = { user: userId };
  if (excludeId) query._id = { $ne: excludeId };
  await Address.updateMany(query, { $set: { isDefault: false } });
};

/* =========================================================
   1. CREATE ADDRESS
========================================================= */
export const createAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    normalizeIsDefault(req.body);

    // Zod Validation
    const result = addressValidationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formatZodErrors(result.error),
      });
    }

    const addressData = result.data;

    // Agar ye user ka pehla address hai, toh isko automatically default bana do
    const addressCount = await Address.countDocuments({ user: userId });
    if (addressCount === 0) {
      addressData.isDefault = true;
    }

    // Agar isDefault true hai, toh is user ke baaki sabhi addresses ko false kar do
    if (addressData.isDefault) {
      await clearOtherDefaults(userId);
    }

    // Security: Hamesha logged-in user ki ID use karein, frontend par trust na karein
    const address = await Address.create({ ...addressData, user: userId });

    return res.status(201).json({
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("Create Address Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/* =========================================================
   2. GET ALL ADDRESSES OF LOGGED-IN USER
========================================================= */
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Default address hamesha list me sabse upar (top) aana chahiye
    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1, // true (1) wali values upar aayengi
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Addresses fetched successfully",
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("Get User Addresses Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. GET SINGLE ADDRESS BY ID
========================================================= */
export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Address ID" });
    }

    // Security Check: Address usi user ka hona chahiye jo request kar raha hai
    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.status(200).json({
      message: "Address fetched successfully",
      address,
    });
  } catch (error) {
    console.error("Get Address By ID Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. UPDATE ADDRESS
========================================================= */
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Address ID" });
    }

    // 1. Check if address exists and belongs to the user
    const existingAddress = await Address.findOne({
      _id: id,
      user: userId,
    });
    if (!existingAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    normalizeIsDefault(req.body);

    // Security: User apna 'user' reference na badal paye
    delete req.body.user;

    // Partial Validation (Kyunki user shayad sirf phone no. update kare)
    const result = addressValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formatZodErrors(result.error),
      });
    }

    const updateData = result.data;

    // Agar update me isDefault true bheja gaya hai, toh baaki sabko false karo
    if (updateData.isDefault === true) {
      await clearOtherDefaults(userId, id); // Current ID ko chhor kar baaki sab
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    return res.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. SET DEFAULT ADDRESS (dedicated endpoint)
========================================================= */
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Address ID" });
    }

    const address = await Address.findOne({ _id: id, user: userId });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (!address.isDefault) {
      // Baaki sabko false karo, phir isko default bana do
      await clearOtherDefaults(userId, id);
      address.isDefault = true;
      await address.save(); // pre('save') hook single-default rule enforce karta hai
    }

    return res.status(200).json({
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   6. DELETE ADDRESS
========================================================= */
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Address ID" });
    }

    // Find and delete ensuring it belongs to the logged-in user
    const deletedAddress = await Address.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Agar deleted address default tha, toh latest wale address ko automatically
    // default bana do (User Experience enhance karne ke liye)
    if (deletedAddress.isDefault) {
      const anotherAddress = await Address.findOne({ user: userId }).sort({
        createdAt: -1,
      });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

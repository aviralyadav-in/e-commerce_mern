import mongoose from "mongoose";
import { Address } from "../models/address.model.js";
import { addressValidationSchema } from "../validators/addressValidate.js"; // Zod schema path

/* =========================================================
   1. CREATE ADDRESS
========================================================= */
export const createAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    // Security: Hamesha logged-in user ki ID use karein, frontend par trust na karein
    req.body.customer = userId.toString();

    // Agar request form-data se aayi hai, toh boolean convert kar lo (JSON hai toh zaroorat nahi)
    if (req.body.is_default === "true") req.body.is_default = true;
    if (req.body.is_default === "false") req.body.is_default = false;

    // Zod Validation
    const result = addressValidationSchema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    const addressData = result.data;

    // Agar ye user ka pehla address hai, toh isko automatically default bana do
    const addressCount = await Address.countDocuments({ customer: userId });
    if (addressCount === 0) {
      addressData.is_default = true;
    }

    // Agar is_default true hai, toh is user ke baaki sabhi addresses ko false kar do
    if (addressData.is_default) {
      await Address.updateMany(
        { customer: userId },
        { $set: { is_default: false } },
      );
    }

    const address = await Address.create(addressData);

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
    const addresses = await Address.find({ customer: userId }).sort({
      is_default: -1, // true (1) wali values upar aayengi
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
    const address = await Address.findOne({ _id: id, customer: userId });

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
      customer: userId,
    });
    if (!existingAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Boolean check
    if (req.body.is_default === "true") req.body.is_default = true;
    if (req.body.is_default === "false") req.body.is_default = false;

    // Security: User apna 'customer' ID na badal paye
    delete req.body.customer;

    // Partial Validation (Kyunki user shayad sirf phone no. update kare)
    const result = addressValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: "Please fix the validation errors",
        errors: formattedErrors,
      });
    }

    const updateData = result.data;

    // Agar update me is_default true bheja gaya hai, toh baaki sabko false karo
    if (updateData.is_default === true) {
      await Address.updateMany(
        { customer: userId, _id: { $ne: id } }, // Current ID ko chhor kar baaki sab
        { $set: { is_default: false } },
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
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
   5. DELETE ADDRESS
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
      customer: userId,
    });

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Agar deleted address default tha, toh kisi aur ek address ko automatically default bana do (User Experience enhance karne ke liye)
    if (deletedAddress.is_default) {
      const anotherAddress = await Address.findOne({ customer: userId });
      if (anotherAddress) {
        anotherAddress.is_default = true;
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

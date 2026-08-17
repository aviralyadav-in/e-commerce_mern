import mongoose from "mongoose";
import { z } from "zod";
import { Coupon } from "../models/coupon.model.js";
import { couponValidationSchema } from "../validators/couponValidate.js";

// User request schema for applying coupon
const applyCouponSchema = z.object({
  code: z
    .string({ required_error: "Coupon code is required" })
    .trim()
    .toUpperCase(),
  orderTotal: z
    .number({ required_error: "Order total is required" })
    .min(0, "Order total cannot be negative"),
});

/* =========================================================
   1. CREATE COUPON (Admin Route)
========================================================= */
export const createCoupon = async (req, res) => {
  try {
    const result = couponValidationSchema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: formattedErrors,
      });
    }

    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      expiryDate,
      isActive,
    } = result.data;

    // Percentage discount cannot exceed 100%
    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        message: "Percentage discount cannot be greater than 100%",
      });
    }

    // Duplicate Check
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(409).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue,
      expiryDate,
      isActive,
    });

    return res.status(201).json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET ALL COUPONS (Admin Route)
========================================================= */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Coupons fetched successfully",
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get All Coupons Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. GET SINGLE COUPON BY ID (Admin Route)
========================================================= */
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Coupon ID" });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    return res.status(200).json({
      message: "Coupon fetched successfully",
      coupon,
    });
  } catch (error) {
    console.error("Get Coupon By ID Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. UPDATE COUPON (Admin Route)
========================================================= */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Coupon ID" });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const result = couponValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: formattedErrors,
      });
    }

    const updateData = { ...result.data };

    // Duplicate Check excluding current coupon
    if (updateData.code) {
      const existingCoupon = await Coupon.findOne({
        code: updateData.code,
        _id: { $ne: id },
      });

      if (existingCoupon) {
        return res.status(409).json({ message: "Coupon code already in use" });
      }
    }

    // Percentage discount check
    const finalDiscountType = updateData.discountType || coupon.discountType;
    const finalDiscountValue =
      updateData.discountValue !== undefined
        ? updateData.discountValue
        : coupon.discountValue;

    if (finalDiscountType === "percentage" && finalDiscountValue > 100) {
      return res.status(400).json({
        message: "Percentage discount cannot be greater than 100%",
      });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. DELETE COUPON (Admin Route)
========================================================= */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Coupon ID" });
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    return res.status(200).json({
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   6. APPLY / VALIDATE COUPON (User Route)
========================================================= */
export const applyCoupon = async (req, res) => {
  try {
    const result = applyCouponSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { code, orderTotal } = result.data;

    // 1. Find Coupon
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      return res
        .status(404)
        .json({ message: "Invalid or inactive coupon code" });
    }

    // 2. Check Expiry Date
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "This coupon has expired" });
    }

    // 3. Check Minimum Order Value
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value must be ₹${coupon.minOrderValue} to apply this coupon`,
      });
    }

    // 4. Calculate Discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    }

    // Discount cannot exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    const finalAmount = orderTotal - discountAmount;

    return res.status(200).json({
      message: "Coupon applied successfully",
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("Apply Coupon Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

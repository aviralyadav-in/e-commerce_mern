import mongoose from "mongoose";
import { z } from "zod";
import { Coupon } from "../models/coupon.model.js";
import {
  couponValidationSchema,
  updateCouponSchema,
} from "../validators/couponValidate.js";
import { csvToObjects, toBool } from "../utils/csvParser.js";
import { splitByModelValidation } from "../utils/validateDoc.js";
import { roundCurrency } from "../utils/commerce.js";

// Store India me hai — date-only expiry us din ke 23:59:59.999 IST tak valid
// rehti hai, server ka timezone (UTC / local) kuch bhi ho
const STORE_UTC_OFFSET = "+05:30";
const DATE_ONLY_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DATE_ONLY_US = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * "YYYY-MM-DD" (admin form) ya "MM/DD/YYYY" (CSV) → us din ka end (IST).
 * Time ke saath poori date ho ya format match na kare toh null — tab
 * parsed date hi use hoti hai.
 */
const endOfStoreDay = (raw) => {
  const value = String(raw ?? "").trim();
  let year;
  let month;
  let day;
  let match = value.match(DATE_ONLY_ISO);
  if (match) {
    [, year, month, day] = match;
  } else if ((match = value.match(DATE_ONLY_US))) {
    [, month, day, year] = match;
  } else {
    return null;
  }
  const date = new Date(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T23:59:59.999${STORE_UTC_OFFSET}`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

// User request schema for applying coupon
const applyCouponSchema = z.object({
  code: z
    .string({ error: "Coupon code is required" })
    .trim()
    .min(1, "Coupon code is required")
    .toUpperCase(),
  orderTotal: z
    .number({ error: "Order total is required and must be a number" })
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
      usageLimit,
      perUserLimit,
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

    // Date-only expiry us din ke end (IST) tak valid — server timezone se independent
    const finalExpiry = endOfStoreDay(req.body.expiryDate) ?? expiryDate;

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue,
      usageLimit,
      perUserLimit,
      expiryDate: finalExpiry,
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

    const result = updateCouponSchema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: formattedErrors,
      });
    }

    // 🛠️ DEFAULT-LEAK GUARD — missing fields should not be overwritten.
    // Sirf request me bheji gayi fields update karo.
    const updateData = {};
    Object.keys(result.data).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = result.data[key];
    });

    // Date-only expiry us din ke end (IST) tak valid — server timezone se independent
    if (updateData.expiryDate) {
      updateData.expiryDate =
        endOfStoreDay(req.body.expiryDate) ?? updateData.expiryDate;
    }

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
      { returnDocument: "after", runValidators: true },
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

    // 2b. Global usage limit — usedCount >= usageLimit ho toh block
    if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ message: "This coupon has reached its usage limit" });
    }

    // 2c. Per-user limit — is user pehle kitni baar use kar chuka
    if (coupon.perUserLimit != null && req.user) {
      const entry = (coupon.usedBy || []).find(
        (u) => String(u.user) === String(req.user._id),
      );
      if (entry && (entry.count || 0) >= coupon.perUserLimit) {
        return res.status(400).json({
          message:
            "You have already used this coupon the maximum number of times",
        });
      }
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
      discountAmount = roundCurrency((orderTotal * coupon.discountValue) / 100);
    } else if (coupon.discountType === "flat") {
      discountAmount = roundCurrency(coupon.discountValue);
    }

    // Discount cannot exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    const finalAmount = roundCurrency(orderTotal - discountAmount);

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

/* =========================================================
   🆕 BULK CREATE COUPONS (Admin CSV Import)
   POST /api/coupons/bulk — multipart/form-data (file: CSV)
========================================================= */
const MAX_COUPON_ROWS = 500;

export const bulkCreateCoupons = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Please upload a CSV file" });
    }

    const rawText = req.file.buffer.toString("utf-8");
    const rows = csvToObjects(rawText);

    if (!rows.length) {
      return res
        .status(400)
        .json({ message: "CSV is empty or has no data rows" });
    }

    if (!("code" in rows[0])) {
      return res.status(400).json({
        message:
          "Invalid CSV format — header row must include 'code' (required: discountType, discountValue, expiryDate; optional: minOrderValue, usageLimit, perUserLimit, isActive)",
      });
    }

    if (rows.length > MAX_COUPON_ROWS) {
      return res.status(400).json({
        message: `Too many rows — maximum ${MAX_COUPON_ROWS} per file`,
      });
    }

    // Existing coupon codes in DB
    const existing = await Coupon.find({}).select("code").lean();
    const existingCodes = new Set(
      existing.map((c) => (c.code || "").toUpperCase()),
    );
    const seenCodes = new Set();

    const docs = [];
    const invalidRows = [];
    const duplicates = [];

    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const rawCode = (row.code || "").trim();
      const code = rawCode.toUpperCase();

      const fail = (error, duplicate = false) =>
        (duplicate ? duplicates : invalidRows).push({
          row: rowNo,
          name: code || `Row ${rowNo}`,
          error,
        });

      if (!code) {
        return fail("'code' is required");
      }

      if (existingCodes.has(code) || seenCodes.has(code)) {
        return fail(`Coupon code '${code}' already exists`, true);
      }

      // CSV header ke alag spellings (discountType / discount_type / discount type)
      const cell = (...keys) =>
        String(keys.map((key) => row[key]).find((v) => v !== undefined) ?? "").trim();
      const toNumber = (raw, emptyValue) => (raw === "" ? emptyValue : Number(raw));

      const rawExpiry = cell("expirydate", "expiry_date", "expiry date");

      // Wahi Zod rules jo admin coupon form (createCoupon) use karta hai —
      // alag se likhe rules drift ho gaye the (jaise discount 0 allow ho jata tha).
      // Khali cells ki keys bhejo hi mat — explicit undefined par couponValidationSchema
      // ka intersection (.and) "Unmergable intersection" throw karta hai
      const input = Object.fromEntries(
        Object.entries({
          code,
          discountType: cell("discounttype", "discount_type", "discount type").toLowerCase(),
          discountValue: toNumber(cell("discountvalue", "discount_value", "discount value"), undefined),
          minOrderValue: toNumber(cell("minordervalue", "min_order_value", "min order value"), undefined),
          usageLimit: toNumber(cell("usagelimit", "usage_limit", "usage limit"), null),
          perUserLimit: toNumber(cell("peruserlimit", "per_user_limit", "per user limit"), null),
          expiryDate: rawExpiry || undefined,
          isActive: toBool(row.isactive ?? row["is_active"] ?? row["is active"], true),
        }).filter(([, value]) => value !== undefined),
      );
      const result = couponValidationSchema.safeParse(input);
      if (!result.success) {
        return fail(result.error.issues[0].message);
      }

      const doc = {
        ...result.data,
        // Date-only expiry us din ke end (IST) tak valid
        expiryDate: endOfStoreDay(rawExpiry) ?? result.data.expiryDate,
        usedCount: 0,
        usedBy: [],
      };

      seenCodes.add(code);
      docs.push({ row: rowNo, name: code, doc });
    });

    // Model rules — insertMany ordered:false invalid docs chupchaap drop kar deta
    const { validDocs, invalidRows: modelInvalidRows } =
      await splitByModelValidation(Coupon, docs);
    invalidRows.push(...modelInvalidRows);
    invalidRows.sort((a, b) => a.row - b.row);

    let inserted = [];
    if (validDocs.length) {
      inserted = await Coupon.insertMany(validDocs, { ordered: false });
    }

    return res.status(200).json({
      message: `Bulk upload complete — ${inserted.length} created, ${duplicates.length} duplicates skipped, ${invalidRows.length} invalid rows`,
      totalRows: rows.length,
      insertedCount: inserted.length,
      skippedDuplicates: duplicates.length,
      invalidRowCount: invalidRows.length,
      invalidRows,
      duplicates,
      coupons: inserted,
    });
  } catch (error) {
    console.error("Bulk Create Coupons Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


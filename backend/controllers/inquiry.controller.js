import mongoose from "mongoose";
import { Inquiry } from "../models/inquiry.model.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const INQUIRY_STATUSES = ["New", "In Progress", "Resolved"];

/* =========================================================
   CREATE INQUIRY
   - Public (storefront contact form): status hamesha "New",
     adminNotes khali — body se set nahi ho sakte
   - Admin lead (POST /admin, adminRoute): status + adminNotes allowed
========================================================= */
const buildCreateInquiry = ({ allowAdminFields }) => async (req, res) => {
  try {
    const { name, email, phone, subject, message, status, adminNotes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (phone && phone.trim()) {
      const clean = phone.replace(/\D/g, "");
      const isIndian =
        clean.length === 10
          ? /^[6-9]\d{9}$/.test(clean)
          : clean.length === 11 && clean.startsWith("0")
            ? /^[6-9]\d{9}$/.test(clean.slice(1))
            : clean.length === 12 && clean.startsWith("91")
              ? /^[6-9]\d{9}$/.test(clean.slice(2))
              : false;
      if (!isIndian) {
        return res
          .status(400)
          .json({ message: "Please enter a valid 10-digit Indian phone number" });
      }
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      subject: subject.trim(),
      message: message.trim(),
      status:
        allowAdminFields && INQUIRY_STATUSES.includes(status) ? status : "New",
      adminNotes:
        allowAdminFields && adminNotes ? String(adminNotes).trim() : "",
    });

    return res.status(201).json({
      message: "Thank you! Your inquiry has been received. We will respond soon.",
      inquiry,
    });
  } catch (error) {
    console.error("Create Inquiry Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createInquiry = buildCreateInquiry({ allowAdminFields: false });
export const createAdminInquiry = buildCreateInquiry({ allowAdminFields: true });

/* =========================================================
   GET ALL INQUIRIES (Admin Only)
   Supports filtering by status, search keyword, and pagination.
   Also returns summary counters (total, new, inProgress, resolved).
========================================================= */
export const getInquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== "All") {
      filter.status = status;
    }

    if (search && search.trim()) {
      // Escape — "(" jaisa search invalid regex bana kar 500 na de
      const q = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    const [inquiries, total, totalAll, newCount, inProgressCount, resolvedCount] =
      await Promise.all([
        Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Inquiry.countDocuments(filter),
        Inquiry.countDocuments({}),
        Inquiry.countDocuments({ status: "New" }),
        Inquiry.countDocuments({ status: "In Progress" }),
        Inquiry.countDocuments({ status: "Resolved" }),
      ]);

    return res.status(200).json({
      message: "Inquiries fetched successfully",
      inquiries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      counts: {
        total: totalAll,
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error("Get Inquiries Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   UPDATE INQUIRY STATUS / NOTES (Admin Only)
========================================================= */
export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inquiry ID" });
    }

    const { status, adminNotes, name, email, phone, subject, message } = req.body;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (status !== undefined) {
      if (!INQUIRY_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      inquiry.status = status;
    }

    if (adminNotes !== undefined) {
      inquiry.adminNotes = String(adminNotes).trim();
    }
    if (name !== undefined && name.trim()) {
      inquiry.name = name.trim();
    }
    if (email !== undefined && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      inquiry.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) {
      inquiry.phone = phone.trim();
    }
    if (subject !== undefined && subject.trim()) {
      inquiry.subject = subject.trim();
    }
    if (message !== undefined && message.trim()) {
      inquiry.message = message.trim();
    }

    await inquiry.save();

    return res.status(200).json({
      message: "Inquiry updated successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Update Inquiry Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   DELETE INQUIRY (Admin Only)
========================================================= */
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid inquiry ID" });
    }

    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    return res.status(200).json({
      message: "Inquiry deleted successfully",
      inquiryId: id,
    });
  } catch (error) {
    console.error("Delete Inquiry Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

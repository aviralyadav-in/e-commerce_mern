import express from "express";
import {
  createInquiry,
  createAdminInquiry,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from "../controllers/inquiry.controller.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const inquiryRouter = express.Router();

// POST /api/inquiries — Public (Storefront Customer Contact Form)
// status hamesha "New" aur adminNotes khali — body se set nahi hote
inquiryRouter.post("/", createInquiry);

// POST /api/inquiries/admin — Admin Only (lead manually log karna, status/adminNotes ke saath)
inquiryRouter.post("/admin", adminRoute, createAdminInquiry);

// GET /api/inquiries — Admin Only
inquiryRouter.get("/", adminRoute, getInquiries);

// PATCH /api/inquiries/:id — Admin Only (Update status / adminNotes)
inquiryRouter.patch("/:id", adminRoute, updateInquiryStatus);

// DELETE /api/inquiries/:id — Admin Only
inquiryRouter.delete("/:id", adminRoute, deleteInquiry);

export default inquiryRouter;

import express from "express";
import {
  getSettings,
  updateSettings,
  resetSettings,
} from "../controllers/settings.controller.js";
import { adminRoute } from "../middleware/admin.middleware.js";

const settingsRouter = express.Router();

// GET /api/settings — public so storefront can display announcement bar & shipping threshold
settingsRouter.get("/", getSettings);

// PUT /api/settings — admin only
settingsRouter.put("/", adminRoute, updateSettings);

// POST /api/settings/reset — admin only reset to factory defaults
settingsRouter.post("/reset", adminRoute, resetSettings);

export default settingsRouter;

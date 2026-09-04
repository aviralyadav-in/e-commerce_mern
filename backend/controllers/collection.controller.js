import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { collectionValidationSchema } from "../validators/collectionValidate.js";
import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import { buildRulesQuery } from "../utils/collectionMatcher.js";

const deleteImageFile = async (imagePath) => {
  if (!imagePath) return;
  if (imagePath.startsWith("http")) return;
  try {
    const filePath = path.join(process.cwd(), imagePath.replace(/^\/+/, ""));
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Delete Image File Error:", error);
    }
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\$&");

// FormData normalise — booleans + rules JSON string
const parseCollectionBody = (body) => {
  ["isActive", "showOnHomePage", "showAsBadge"].forEach((key) => {
    if (body[key] === "true") body[key] = true;
    if (body[key] === "false") body[key] = false;
  });
  if (typeof body.rules === "string") {
    try {
      const parsed = JSON.parse(body.rules);
      body.rules = Array.isArray(parsed) ? parsed : [];
    } catch {
      body.rules = [];
    }
  }
  // manual collection ke paas rules nahi hote
  if (body.type !== "automated") body.rules = [];
};

/* =========================================================
   CREATE COLLECTION
========================================================= */
export const createCollection = async (req, res) => {
  try {
    parseCollectionBody(req.body);

    const result = collectionValidationSchema.safeParse(req.body);
    if (!result.success) {
      if (req.file)
        await deleteImageFile(`/uploads/collections/${req.file.filename}`);
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, slug, description, type, rules, isActive, showOnHomePage, showAsBadge } =
      result.data;

    const existing = await Collection.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") } },
        { slug },
      ],
    });
    if (existing) {
      if (req.file)
        await deleteImageFile(`/uploads/collections/${req.file.filename}`);
      return res.status(409).json({
        message:
          existing.slug === slug
            ? "Collection slug already exists"
            : "Collection name already exists",
      });
    }

    const imageUrl = req.file
      ? `/uploads/collections/${req.file.filename}`
      : "";

    const collection = await Collection.create({
      name,
      slug,
      description,
      image: imageUrl,
      type,
      rules: type === "automated" ? rules : [],
      isActive,
      showOnHomePage,
      showAsBadge,
    });

    return res.status(201).json({
      message: "Collection created successfully",
      collection,
    });
  } catch (error) {
    console.error("Create Collection Error:", error);
    if (req.file)
      await deleteImageFile(`/uploads/collections/${req.file.filename}`);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   UPDATE COLLECTION
========================================================= */
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    parseCollectionBody(req.body);

    const result = collectionValidationSchema.partial().safeParse(req.body);
    if (!result.success) {
      if (req.file)
        await deleteImageFile(`/uploads/collections/${req.file.filename}`);
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    const updateData = { ...result.data };

    // type manual hua to rules clear kar do
    const finalType = updateData.type || collection.type;
    if (finalType !== "automated") updateData.rules = [];

    if (updateData.name || updateData.slug) {
      const orConditions = [];
      if (updateData.name)
        orConditions.push({
          name: { $regex: new RegExp(`^${escapeRegex(updateData.name)}$`, "i") },
        });
      if (updateData.slug) orConditions.push({ slug: updateData.slug });

      const existing = await Collection.findOne({
        $or: orConditions,
        _id: { $ne: id },
      });
      if (existing) {
        if (req.file)
          await deleteImageFile(`/uploads/collections/${req.file.filename}`);
        return res
          .status(409)
          .json({ message: "Collection name or slug already in use" });
      }
    }

    if (req.file) {
      updateData.image = `/uploads/collections/${req.file.filename}`;
      if (collection.image && updateData.image !== collection.image) {
        await deleteImageFile(collection.image);
      }
    }

    const updated = await Collection.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    return res.status(200).json({
      message: "Collection updated successfully",
      collection: updated,
    });
  } catch (error) {
    console.error("Update Collection Error:", error);
    if (req.file)
      await deleteImageFile(`/uploads/collections/${req.file.filename}`);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET ALL COLLECTIONS (public — sirf active)
========================================================= */
export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({
      createdAt: -1,
    });
    return res.status(200).json({
      message: "Collections fetched successfully",
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error("Get Collections Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET ALL COLLECTIONS (admin — inactive bhi + live product count)
========================================================= */
export const getAdminCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 }).lean();

    const withCounts = await Promise.all(
      collections.map(async (c) => {
        // automated → rules query; manual → linked products
        if (c.type === "automated") {
          const ruleQuery = buildRulesQuery(c.rules);
          const productCount = ruleQuery.length
            ? await Product.countDocuments({ $and: ruleQuery })
            : 0;
          return { ...c, productCount };
        }
        const productCount = await Product.countDocuments({
          collections: c._id,
        });
        return { ...c, productCount };
      }),
    );

    return res.status(200).json({
      message: "All collections fetched successfully",
      count: withCounts.length,
      collections: withCounts,
    });
  } catch (error) {
    console.error("Get Admin Collections Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET COLLECTION BY ID
========================================================= */
export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    return res.status(200).json({
      message: "Collection fetched successfully",
      collection,
    });
  } catch (error) {
    console.error("Get Collection By ID Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   RESTORE COLLECTION (undo soft delete)
========================================================= */
export const restoreCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }
    const collection = await Collection.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    );
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    return res.status(200).json({
      message: "Collection restored successfully",
      collection,
    });
  } catch (error) {
    console.error("Restore Collection Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   DELETE COLLECTION (SOFT DELETE)
========================================================= */
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    await Collection.findByIdAndUpdate(id, { isActive: false });
    return res.status(200).json({
      message: "Collection deactivated successfully (soft deleted)",
    });
  } catch (error) {
    console.error("Delete Collection Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

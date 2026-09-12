import mongoose from "mongoose";
import { collectionValidationSchema, updateCollectionSchema, bulkAddProductsSchema } from "../validators/collectionValidate.js";
import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import { csvToObjects, slugify, toBool } from "../utils/csvParser.js";
import { deleteFile as deleteFromCloudinary } from "../utils/storage.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { splitByModelValidation } from "../utils/validateDoc.js";

// FormData normalise — booleans
const parseCollectionBody = (body) => {
  ["isActive", "showOnHomePage", "showAsBadge"].forEach((key) => {
    if (body[key] === "true") body[key] = true;
    if (body[key] === "false") body[key] = false;
  });
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
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, slug, description, isActive, showOnHomePage, showAsBadge } =
      result.data;

    const existing = await Collection.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") } },
        { slug },
      ],
    });
    if (existing) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(409).json({
        message:
          existing.slug === slug
            ? "Collection slug already exists"
            : "Collection name already exists",
      });
    }

    const imageUrl = req.file ? req.file.path : "";

    const collection = await Collection.create({
      name,
      slug,
      description,
      image: imageUrl,
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
      await deleteFromCloudinary(req.file.path);
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
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Collection not found" });
    }

    parseCollectionBody(req.body);

    const result = updateCollectionSchema.safeParse(req.body);
    if (!result.success) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    const updateData = {};
    Object.keys(result.data).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = result.data[key];
    });

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
          await deleteFromCloudinary(req.file.path);
        return res
          .status(409)
          .json({ message: "Collection name or slug already in use" });
      }
    }

    // Image sirf file upload se set hoti hai (body ki string ignore)
    delete updateData.image;
    if (req.file) updateData.image = req.file.path;

    const updated = await Collection.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    // ✅ Purani image DB update ke BAAD delete karo — update fail ho toh
    // collection ek deleted image par point na kare
    if (req.file && collection.image) {
      await deleteFromCloudinary(collection.image);
    }

    return res.status(200).json({
      message: "Collection updated successfully",
      collection: updated,
    });
  } catch (error) {
    console.error("Update Collection Error:", error);
    if (req.file)
      await deleteFromCloudinary(req.file.path);
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
/* =========================================================
   🆕 BULK ADD PRODUCTS TO COLLECTION (products table bulk action)
   POST /admin/bulk-add-products — { collectionId, productIds[] }
   - Skip already-added (no duplicates) — $addToSet = DB-level guard
   - Response: { added, skipped }
========================================================= */
export const bulkAddProductsToCollection = async (req, res) => {
  try {
    const result = bulkAddProductsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { collectionId, productIds: rawIds } = result.data;

    // Dedupe — ek hi id dobara na jaye
    const productIds = [...new Set(rawIds)];

    // Collection exists + active?
    const collection = await Collection.findById(collectionId).lean();
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    if (!collection.isActive) {
      return res
        .status(409)
        .json({ message: "Collection is inactive — activate it first." });
    }

    // Sab product IDs valid?
    const foundCount = await Product.countDocuments({
      _id: { $in: productIds },
    });
    if (foundCount !== productIds.length) {
      return res.status(409).json({
        message:
          "Some product IDs are invalid — refresh the page and try again.",
      });
    }

    // Already-in skip — jo products is collection me hain unhe chhod do
    const alreadyIn = await Product.find({
      _id: { $in: productIds },
      collections: collectionId,
    })
      .select("_id")
      .lean();
    const alreadySet = new Set(alreadyIn.map((p) => String(p._id)));
    const toAdd = productIds.filter((id) => !alreadySet.has(id));

    let added = 0;
    if (toAdd.length) {
      // Single atomic updateMany — $addToSet set semantics duplicate-proof
      const updateResult = await Product.updateMany(
        { _id: { $in: toAdd } },
        { $addToSet: { collections: collectionId } },
      );
      added = updateResult.modifiedCount ?? toAdd.length;
    }

    return res.status(200).json({
      message: `${added} product(s) added to "${collection.name}"`,
      added,
      skipped: productIds.length - added,
      collection,
    });
  } catch (error) {
    console.error("Bulk Add Products To Collection Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

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
      { returnDocument: "after" },
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

/* =========================================================
   🆕 BULK CREATE COLLECTIONS (CSV Upload)
   -------------------------------------------------------
   Columns: name* | description | showOnHomePage | showAsBadge | isActive
   - Slug naam se auto-generate hota hai
   - Duplicates (DB ya file ke andar) skip hote hain
   - insertMany ordered:false — invalid rows baaki ko block nahi karte
========================================================= */
export const bulkCreateCollections = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ message: "CSV file is required (form field: 'file')" });
    }

    const MAX_ROWS = 500;
    const rows = csvToObjects(req.file.buffer.toString("utf8"));

    if (!rows.length) {
      return res
        .status(400)
        .json({ message: "CSV is empty or has no data rows" });
    }
    if (!("name" in rows[0])) {
      return res.status(400).json({
        message:
          "Invalid CSV format — header row must include 'name' (optional: description, showOnHomePage, showAsBadge, isActive)",
      });
    }
    if (rows.length > MAX_ROWS) {
      return res
        .status(400)
        .json({ message: `Too many rows — maximum ${MAX_ROWS} per file` });
    }

    const existing = await Collection.find({}).select("name slug").lean();
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const seenNames = new Set();
    const seenSlugs = new Set();

    const docs = [];
    const invalidRows = [];
    const duplicates = [];
    let skipped = 0;

    rows.forEach((row, index) => {
      const rowNo = index + 2;
      const name = (row.name || "").trim();

      const fail = (error, duplicate = false) =>
        (duplicate ? duplicates : invalidRows).push({
          row: rowNo,
          name,
          error,
        });

      if (!name) return fail("'name' is required");

      const lowerName = name.toLowerCase();
      if (existingNames.has(lowerName) || seenNames.has(lowerName)) {
        skipped += 1;
        return fail("Collection name already exists", true);
      }

      const slug = slugify(name);
      if (!slug) return fail("Name se valid slug generate nahi ho paya");

      if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
        skipped += 1;
        return fail(`Slug '${slug}' already exists`, true);
      }

      const doc = {
        name,
        slug,
        description: (row.description || "").slice(0, 500),
        showOnHomePage: toBool(row.showonhomepage ?? row["show on home page"], false),
        showAsBadge: toBool(row.showasbadge ?? row["show as badge"], false),
        isActive: toBool(row.isactive, true),
        image: "",
      };

      seenNames.add(lowerName);
      seenSlugs.add(slug);
      docs.push({ row: rowNo, name, doc });
    });

    // Model rules (name 2-100 chars etc.) — insertMany ordered:false invalid
    // docs chupchaap drop kar deta, isliye insert se pehle check karke report karo
    const { validDocs, invalidRows: modelInvalidRows } =
      await splitByModelValidation(Collection, docs);
    invalidRows.push(...modelInvalidRows);
    invalidRows.sort((a, b) => a.row - b.row);

    let inserted = [];
    if (validDocs.length) {
      inserted = await Collection.insertMany(validDocs, { ordered: false });
    }

    const collectionsWithCounts = inserted.map((c) => ({
      ...c.toObject(),
      productCount: 0,
    }));

    return res.status(200).json({
      message: `Bulk upload complete — ${inserted.length} created, ${duplicates.length} duplicates skipped, ${invalidRows.length} invalid rows`,
      totalRows: rows.length,
      insertedCount: inserted.length,
      skippedDuplicates: duplicates.length,
      invalidRowCount: invalidRows.length,
      invalidRows,
      duplicates,
      collections: collectionsWithCounts,
    });
  } catch (error) {
    console.error("Bulk Create Collections Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   🆕 TOGGLE COLLECTION STATUS (active ⇄ inactive)
========================================================= */
export const toggleCollectionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collection ID" });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const updated = await Collection.findByIdAndUpdate(
      id,
      { isActive: !collection.isActive },
      { returnDocument: "after" },
    );

    return res.status(200).json({
      message: `Collection ${updated.isActive ? "activated" : "deactivated"} successfully`,
      collection: updated,
    });
  } catch (error) {
    console.error("Toggle Collection Status Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

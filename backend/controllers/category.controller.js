import mongoose from "mongoose";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/categoryValidate.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { csvToObjects, slugify, toBool } from "../utils/csvParser.js";
import { deleteFile as deleteFromCloudinary } from "../utils/storage.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { splitByModelValidation } from "../utils/validateDoc.js";
import {
  checkHierarchyChange,
  rebuildCategoryHierarchy,
} from "../utils/categoryHierarchy.js";

// multipart/form-data me boolean string format ('true'/'false') me aata hai,
// isko parse karna zaroori hai warna Zod fail ho jayega.
// (gender JSON string, sortOrder aur parentId/childId schema khud normalize karta hai)
const parseBooleanFields = (body) => {
  if (body.isActive === "true") body.isActive = true;
  if (body.isActive === "false") body.isActive = false;
};

/* =========================================================
   CREATE CATEGORY
========================================================= */
export const createCategory = async (req, res) => {
  let imageSaved = false;
  try {
    parseBooleanFields(req.body);

    /* -------------------------
       Zod Validation (Only Body)
    ------------------------- */
    const result = createCategorySchema.safeParse(req.body);

    if (!result.success) {
      if (req.file) {
        await deleteFromCloudinary(req.file.path);
      }
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      name,
      slug,
      description,
      isActive,
      gender,
      parentId,
      childId,
      sortOrder,
    } = result.data;

    /* -------------------------
       Duplicate Check (Name OR Slug)
    ------------------------- */
    const existingCategory = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") } },
        { slug: slug },
      ],
    });

    if (existingCategory) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(409).json({
        message:
          existingCategory.slug === slug
            ? "Category slug already exists"
            : "Category name already exists",
      });
    }

    /* -------------------------
       🆕 Hierarchy validation — parent/child exist karein,
       cycle na bane, tree 3 levels se gehra na ho
    ------------------------- */
    const hierarchyError = await checkHierarchyChange({ parentId, childId });
    if (hierarchyError) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: hierarchyError });
    }

    /* -------------------------
       Handle Image & Create
    ------------------------- */
    const category = await Category.create({
      name,
      slug,
      description,
      isActive,
      gender,
      sortOrder,
      parentId: parentId || null,
      image: req.file ? req.file.path : "",
    });
    imageSaved = true;

    // 🆕 Advanced re-parent — existing category ko is category ke under move karo
    if (childId) {
      await Category.findByIdAndUpdate(childId, {
        $set: { parentId: category._id },
      });
    }

    // level/path computed fields — naya node + moved child ka subtree
    await rebuildCategoryHierarchy();

    const [savedCategory, childCategory] = await Promise.all([
      Category.findById(category._id),
      childId ? Category.findById(childId) : null,
    ]);

    return res.status(201).json({
      message: "Category created successfully",
      category: savedCategory,
      childCategory,
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    if (req.file && !imageSaved) {
      await deleteFromCloudinary(req.file.path);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET ALL CATEGORIES
========================================================= */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Categories fetched successfully",
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET CATEGORY BY ID
========================================================= */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      category,
    });
  } catch (error) {
    console.error("Get Category By ID Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   UPDATE CATEGORY
========================================================= */
export const updateCategory = async (req, res) => {
  let imageSaved = false;
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(404).json({ message: "Category not found" });
    }

    parseBooleanFields(req.body);

    /* -------------------------
       Zod Partial Validation
    ------------------------- */
    const result = updateCategorySchema.safeParse(req.body);

    if (!result.success) {
      if (req.file)
        await deleteFromCloudinary(req.file.path);
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    // 🛠️ DEFAULT-LEAK GUARD — partial() + default(): missing fields me
    // defaults (image="", description="", isActive=true...) inject hokar
    // existing values wipe na hon. Sirf request me bheji fields rakho.
    const updateData = {};
    Object.keys(result.data).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = result.data[key];
    });

    // childId category ka field nahi — sirf "is category ke under move karo" instruction
    const { childId } = updateData;
    delete updateData.childId;

    /* -------------------------
       Duplicate Check (Excluding self)
    ------------------------- */
    if (updateData.name || updateData.slug) {
      const orConditions = [];
      if (updateData.name)
        orConditions.push({
          name: {
            $regex: new RegExp(`^${escapeRegex(updateData.name)}$`, "i"),
          },
        });
      if (updateData.slug) orConditions.push({ slug: updateData.slug });

      const existingCategory = await Category.findOne({
        $or: orConditions,
        _id: { $ne: id },
      });

      if (existingCategory) {
        if (req.file)
          await deleteFromCloudinary(req.file.path);
        return res
          .status(409)
          .json({ message: "Category name or slug already in use" });
      }
    }

    /* -------------------------
       🆕 Hierarchy validation — parent badla ya child move hua toh
       self-parent / cycle / max depth rules check
    ------------------------- */
    const currentParentId = category.parentId ? String(category.parentId) : null;
    const nextParentId =
      updateData.parentId !== undefined
        ? updateData.parentId || null
        : currentParentId;
    const hierarchyChanged =
      String(nextParentId) !== String(currentParentId) || Boolean(childId);

    if (hierarchyChanged) {
      const hierarchyError = await checkHierarchyChange({
        categoryId: id,
        parentId: nextParentId,
        childId,
      });
      if (hierarchyError) {
        if (req.file)
          await deleteFromCloudinary(req.file.path);
        return res.status(400).json({ message: hierarchyError });
      }
    }

    /* -------------------------
       Handle Image Replacement
       - Image sirf file upload se set hoti hai (body ki string ignore)
       - Purani image DB update ke BAAD delete hoti hai, taaki update
         fail ho toh category ek deleted image par point na kare
    ------------------------- */
    delete updateData.image;
    if (req.file) updateData.image = req.file.path;

    let updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );
    imageSaved = true;

    if (req.file && category.image) {
      await deleteFromCloudinary(category.image);
    }

    let childCategory = null;
    if (hierarchyChanged) {
      if (childId) {
        await Category.findByIdAndUpdate(childId, { $set: { parentId: id } });
      }
      await rebuildCategoryHierarchy();
      [updatedCategory, childCategory] = await Promise.all([
        Category.findById(id),
        childId ? Category.findById(childId) : null,
      ]);
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
      childCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    if (req.file && !imageSaved)
      await deleteFromCloudinary(req.file.path);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET ALL CATEGORIES (ADMIN — inactive bhi, restore ke liye)
========================================================= */
export const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("parentId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "All categories fetched successfully",
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Admin Categories Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   RESTORE CATEGORY (undo soft delete)
========================================================= */
export const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { isActive: true },
      { returnDocument: "after" },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category restored successfully",
      category,
    });
  } catch (error) {
    console.error("Restore Category Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   DELETE CATEGORY (SOFT DELETE)
========================================================= */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    /* -------------------------
       Fix: Use categoryId instead of category
    ------------------------- */
    // Aapke product schema me category ka reference "categoryId" hai
    const productsCount = await Product.countDocuments({
      categoryId: id,
      isActive: true,
    });

    if (productsCount > 0) {
      return res.status(409).json({
        message: `Cannot delete category. It is linked to ${productsCount} active product(s).`,
      });
    }

    // 🆕 Parent delete hone par children top-level ho jaate hain
    await Category.updateMany({ parentId: id }, { $set: { parentId: null } });
    await Category.findByIdAndUpdate(id, { isActive: false });
    // Top-level bane children (aur unke subtree) ka level/path update
    await rebuildCategoryHierarchy();

    return res.status(200).json({
      message: "Category deactivated successfully (soft deleted)",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET CATEGORY PRODUCTS
========================================================= */
export const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category || !category.isActive) {
      return res
        .status(404)
        .json({ message: "Category not found or inactive" });
    }

    /* -------------------------
       Fix: Use categoryId and populate categoryId
    ------------------------- */
    const products = await Product.find({ categoryId: id, isActive: true })
      .populate("categoryId", "name image") // .populate ko bhi categoryId kar diya gaya hai
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Category products fetched successfully",
      category: {
        id: category._id,
        name: category.name,
        image: category.image,
      },
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Category Products Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   🆕 BULK CREATE CATEGORIES (CSV Upload)
   -------------------------------------------------------
   Columns: name* | description | gender ("Men,Women") | isActive
   - Slug naam se auto-generate hota hai
   - Duplicates (DB ya file ke andar) skip hote hain
   - Model rules par fail hone wali rows invalidRows me report hoti hain
     (insertMany ordered:false unhe chupchaap drop kar deta)
========================================================= */
export const bulkCreateCategories = async (req, res) => {
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
          "Invalid CSV format — header row must include 'name' (optional: description, gender, isActive)",
      });
    }
    if (rows.length > MAX_ROWS) {
      return res
        .status(400)
        .json({ message: `Too many rows — maximum ${MAX_ROWS} per file` });
    }

    // Ek hi query me saare existing names/slugs — fast dedupe
    const existing = await Category.find({}).select("name slug").lean();
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const seenNames = new Set();
    const seenSlugs = new Set();

    const docs = [];
    const invalidRows = [];
    const duplicates = [];

    rows.forEach((row, index) => {
      const rowNo = index + 2; // +2 → header ke baad 1-based row number
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
        return fail("Category name already exists", true);
      }

      const slug = slugify(name);
      if (!slug) return fail("Name se valid slug generate nahi ho paya");

      if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
        return fail(`Slug '${slug}' already exists`, true);
      }

      // Template ka 'gender' column (purana 'subCategories' column bhi accept)
      const genders = (row.gender ?? row.subcategories ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s === "Men" || s === "Women");

      // Bulk categories top-level hoti hain — level/path pehle se set
      const _id = new mongoose.Types.ObjectId();
      const doc = {
        _id,
        name,
        slug,
        description: (row.description || "").slice(0, 500),
        gender: genders.length ? [...new Set(genders)] : ["Men", "Women"],
        isActive: toBool(row.isactive, true),
        image: "", // Image baad me normal Edit se upload ho sakti hai
        level: 0,
        path: String(_id),
      };

      seenNames.add(lowerName);
      seenSlugs.add(slug);
      docs.push({ row: rowNo, name, doc });
    });

    // Model rules (name 2-100 chars etc.) — insertMany ordered:false invalid
    // docs chupchaap drop kar deta, isliye insert se pehle check karke report karo
    const { validDocs, invalidRows: modelInvalidRows } =
      await splitByModelValidation(Category, docs);
    invalidRows.push(...modelInvalidRows);
    invalidRows.sort((a, b) => a.row - b.row);

    let inserted = [];
    if (validDocs.length) {
      inserted = await Category.insertMany(validDocs, { ordered: false });
    }

    return res.status(200).json({
      message: `Bulk upload complete — ${inserted.length} created, ${duplicates.length} duplicates skipped, ${invalidRows.length} invalid rows`,
      totalRows: rows.length,
      insertedCount: inserted.length,
      skippedDuplicates: duplicates.length,
      invalidRowCount: invalidRows.length,
      invalidRows,
      duplicates,
      categories: inserted,
    });
  } catch (error) {
    console.error("Bulk Create Categories Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   CHECK SLUG & NAME AVAILABILITY
========================================================= */
export const checkSlugAvailability = async (req, res) => {
  try {
    const { slug, name, excludeId } = req.query;

    if (!slug && !name) {
      return res.status(400).json({ message: "Slug or name is required" });
    }

    const baseFilter = {};
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      baseFilter._id = { $ne: excludeId };
    }

    let nameTaken = false;
    let slugTaken = false;

    if (name && name.trim()) {
      const existingName = await Category.findOne({
        ...baseFilter,
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      }).select("_id").lean();
      if (existingName) nameTaken = true;
    }

    if (slug && slug.trim()) {
      const existingSlug = await Category.findOne({
        ...baseFilter,
        slug: slug.trim().toLowerCase(),
      }).select("_id").lean();
      if (existingSlug) slugTaken = true;
    }

    const available = !nameTaken && !slugTaken;

    return res.status(200).json({
      available,
      nameTaken,
      slugTaken,
    });
  } catch (error) {
    console.error("Check Slug Availability Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   TOGGLE CATEGORY STATUS (active <-> inactive)
========================================================= */
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    return res.status(200).json({
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      category,
    });
  } catch (error) {
    console.error("Toggle Category Status Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

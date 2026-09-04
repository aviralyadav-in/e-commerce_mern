import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { categoryValidationSchema } from "../validators/categoryValidate.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { csvToObjects, slugify, toBool } from "../utils/csvParser.js";

const deleteImageFile = async (imagePath) => {
  if (!imagePath) return;

  // Do not delete external images
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

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =========================================================
   CREATE CATEGORY
========================================================= */
export const createCategory = async (req, res) => {
  try {
    /* -------------------------
       Fix: FormData Boolean Conversion
    ------------------------- */
    // multipart/form-data me boolean string format ('true'/'false') me aata hai,
    // isko parse karna zaroori hai warna Zod fail ho jayega.
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // 🆕 parentId — FormData me "" (top-level) ya ObjectId string aata hai
    if (req.body.parentId === "" || req.body.parentId === "null") {
      req.body.parentId = null;
    }

    // FormData me subCategories JSON string / single value aa sakta hai
    if (typeof req.body.subCategories === "string") {
      try {
        const parsed = JSON.parse(req.body.subCategories);
        req.body.subCategories = Array.isArray(parsed)
          ? parsed
          : [req.body.subCategories];
      } catch {
        req.body.subCategories = [req.body.subCategories];
      }
    }

    /* -------------------------
       Zod Validation (Only Body)
    ------------------------- */
    const result = categoryValidationSchema.safeParse(req.body);

    if (!result.success) {
      if (req.file) {
        await deleteImageFile(`/uploads/categories/${req.file.filename}`);
      }
      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    // Fix: parentCategory hata diya gaya hai kyunki schema me nahi hai
    const { name, slug, description, isActive, subCategories, parentId } =
      result.data;

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
        await deleteImageFile(`/uploads/categories/${req.file.filename}`);
      return res.status(409).json({
        message:
          existingCategory.slug === slug
            ? "Category slug already exists"
            : "Category name already exists",
      });
    }

    /* -------------------------
       🆕 Parent category validation — exist karti ho
    ------------------------- */
    if (parentId) {
      const parentExists = await Category.findById(parentId).lean();
      if (!parentExists) {
        if (req.file)
          await deleteImageFile(`/uploads/categories/${req.file.filename}`);
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    /* -------------------------
       Handle Image & Create
    ------------------------- */
    const imageUrl = req.file ? `/uploads/categories/${req.file.filename}` : "";

    const category = await Category.create({
      name,
      slug,
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
      parentId: parentId || null,
      subCategories: subCategories?.length ? subCategories : ["Men", "Women"],
      image: imageUrl,
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);
    if (req.file) {
      await deleteImageFile(`/uploads/categories/${req.file.filename}`);
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
       Fix: FormData Boolean Conversion
    ------------------------- */
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // 🆕 parentId — FormData me "" (top-level) ya ObjectId string aata hai
    if (req.body.parentId === "" || req.body.parentId === "null") {
      req.body.parentId = null;
    }

    if (typeof req.body.subCategories === "string") {
      try {
        const parsed = JSON.parse(req.body.subCategories);
        req.body.subCategories = Array.isArray(parsed)
          ? parsed
          : [req.body.subCategories];
      } catch {
        req.body.subCategories = [req.body.subCategories];
      }
    }

    /* -------------------------
       Zod Partial Validation
    ------------------------- */
    const result = categoryValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      if (req.file)
        await deleteImageFile(`/uploads/categories/${req.file.filename}`);
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const updateData = { ...result.data };

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
          await deleteImageFile(`/uploads/categories/${req.file.filename}`);
        return res
          .status(409)
          .json({ message: "Category name or slug already in use" });
      }
    }

    /* -------------------------
       🆕 Parent category validation — khud ko parent na banao,
       parent exist karti ho
    ------------------------- */
    if (updateData.parentId) {
      if (String(updateData.parentId) === String(id)) {
        if (req.file)
          await deleteImageFile(`/uploads/categories/${req.file.filename}`);
        return res
          .status(400)
          .json({ message: "Category cannot be its own parent" });
      }
      const parentExists = await Category.findById(updateData.parentId).lean();
      if (!parentExists) {
        if (req.file)
          await deleteImageFile(`/uploads/categories/${req.file.filename}`);
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    /* -------------------------
       Handle Image Replacement
    ------------------------- */
    if (req.file) {
      updateData.image = `/uploads/categories/${req.file.filename}`;
      if (category.image && updateData.image !== category.image) {
        await deleteImageFile(category.image);
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    if (req.file)
      await deleteImageFile(`/uploads/categories/${req.file.filename}`);
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
      { new: true },
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
   Columns: name* | description | subCategories ("Men,Women") | isActive
   - Slug naam se auto-generate hota hai
   - Duplicates (DB ya file ke andar) skip hote hain
   - insertMany ordered:false — invalid rows baaki ko block nahi karte
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
          "Invalid CSV format — header row must include 'name' (optional: description, subCategories, isActive)",
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
    let skipped = 0;

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
        skipped += 1;
        return fail("Category name already exists", true);
      }

      const slug = slugify(name);
      if (!slug) return fail("Name se valid slug generate nahi ho paya");

      if (existingSlugs.has(slug) || seenSlugs.has(slug)) {
        skipped += 1;
        return fail(`Slug '${slug}' already exists`, true);
      }

      const subCategories = (row.subcategories || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s === "Men" || s === "Women");

      seenNames.add(lowerName);
      seenSlugs.add(slug);
      docs.push({
        name,
        slug,
        description: (row.description || "").slice(0, 500),
        subCategories: subCategories.length
          ? [...new Set(subCategories)]
          : ["Men", "Women"],
        isActive: toBool(row.isactive, true),
        image: "", // Image baad me normal Edit se upload ho sakti hai
      });
    });

    let inserted = [];
    if (docs.length) {
      inserted = await Category.insertMany(docs, { ordered: false });
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

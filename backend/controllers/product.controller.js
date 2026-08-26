import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { productValidationSchema } from "../validators/productValidate.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { csvToObjects, slugify, toBool } from "../utils/csvParser.js";

/* =========================================================
   HELPER FUNCTIONS
========================================================= */
const deleteImageFile = async (imagePath) => {
  if (!imagePath) return;
  if (imagePath.startsWith("http")) return; // External URL ignore karein

  try {
    const filePath = path.join(process.cwd(), imagePath.replace(/^\/+/, ""));
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Delete Image File Error:", error);
    }
  }
};

// Form-data/Multer ke baad saari uploaded files ko ek flat array me laane ka helper (Delete karne ke liye)
const getUploadedFilesPaths = (files) => {
  if (!files) return [];
  const paths = [];
  if (files.desktopImages)
    paths.push(
      ...files.desktopImages.map((f) => `/uploads/products/${f.filename}`),
    );
  if (files.mobileImages)
    paths.push(
      ...files.mobileImages.map((f) => `/uploads/products/${f.filename}`),
    );
  return paths;
};

// Request se images extract karke schema format me badalna
const extractImages = (req) => {
  const images = { desktop: [], mobile: [] };

  if (req.files) {
    if (req.files.desktopImages) {
      images.desktop = req.files.desktopImages.map(
        (file) => `/uploads/products/${file.filename}`,
      );
    }
    if (req.files.mobileImages) {
      images.mobile = req.files.mobileImages.map(
        (file) => `/uploads/products/${file.filename}`,
      );
    }
  }
  return images;
};

/* =========================================================
   CREATE PRODUCT
========================================================= */
export const createProduct = async (req, res) => {
  try {
    // 1. FormData fields ko parse karna (String to Number/Boolean)
    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.discountPrice)
      req.body.discountPrice = Number(req.body.discountPrice);
    if (req.body.stock) req.body.stock = Number(req.body.stock);
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // Collection flags — FormData se "true"/"false" string aata hai
    ["isFeatured", "isBestSeller", "isNewArrival"].forEach((key) => {
      if (req.body[key] !== undefined)
        req.body[key] = req.body[key] === "true" || req.body[key] === true;
    });

    // 2. Images extract karna
    req.body.images = extractImages(req);

    // 3. Zod Validation
    const result = productValidationSchema.safeParse(req.body);

    if (!result.success) {
      // Validation fail - uploaded files delete karo
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));

      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { categoryId, slug, sku } = result.data;

    // 4. Category Check
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const categoryExists = await Category.findById(categoryId).lean();
    if (!categoryExists) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
      return res.status(404).json({ message: "Category not found" });
    }

    // 5. Unique Check (Slug & SKU)
    const existingProduct = await Product.findOne({ $or: [{ slug }, { sku }] });
    if (existingProduct) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
      return res.status(409).json({
        message:
          existingProduct.slug === slug
            ? "Product slug already exists"
            : "Product SKU already exists",
      });
    }

    // 6. Create Product
    const product = await Product.create(result.data);

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    const uploadedPaths = getUploadedFilesPaths(req.files);
    await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET ALL PRODUCTS
========================================================= */
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      categoryId,
      subCategory,
      collection,
      onSale,
      isActive,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    const andConditions = [];

    // Multiple category support — comma-separated IDs
    if (categoryId) {
      const ids = String(categoryId)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      filter.categoryId = ids.length > 1 ? { $in: ids } : ids[0];
    }

    // Gender filter — comma-separated (Men, Women)
    if (subCategory) {
      filter.subCategory = { $in: String(subCategory).split(",").filter(Boolean) };
    }

    // Collection tags — featured / best / new (comma-separated)
    if (collection) {
      const tags = String(collection).split(",").map((t) => t.trim());
      const tagConditions = [];
      if (tags.includes("featured")) tagConditions.push({ isFeatured: true });
      if (tags.includes("best")) tagConditions.push({ isBestSeller: true });
      if (tags.includes("new")) tagConditions.push({ isNewArrival: true });
      if (tagConditions.length) andConditions.push({ $or: tagConditions });
    }

    // Sale — sirf discounted products (discountPrice < price)
    if (onSale === "true") {
      filter.$expr = {
        $and: [
          { $ne: ["$discountPrice", null] },
          { $gt: ["$discountPrice", 0] },
          { $lt: ["$discountPrice", "$price"] },
        ],
      };
    }

    // Storefront ke liye sirf active products
    if (isActive === "true") filter.isActive = true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Search $or aur collection $or ko merge karne ke liye $and use karo
    if (andConditions.length) filter.$and = andConditions;

    const sortOptions = { [sort]: order === "asc" ? 1 : -1 };

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name image") // Corrected populate reference
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / Number(limit));

    return res.status(200).json({
      message: "Products fetched successfully",
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        limit: Number(limit),
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   GET PRODUCT BY ID
========================================================= */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate("categoryId", "name description image") // Corrected populate reference
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. Parse incoming FormData
    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.discountPrice)
      req.body.discountPrice = Number(req.body.discountPrice);
    if (req.body.stock) req.body.stock = Number(req.body.stock);
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // Collection flags — FormData se "true"/"false" string aata hai
    ["isFeatured", "isBestSeller", "isNewArrival"].forEach((key) => {
      if (req.body[key] !== undefined)
        req.body[key] = req.body[key] === "true" || req.body[key] === true;
    });

    // 2. Extract new images
    const newImages = extractImages(req);

    // Agar kisi device type ki nayi file aayi hai, toh usko body me append karein
    if (!req.body.images) req.body.images = {};
    if (newImages.desktop.length > 0)
      req.body.images.desktop = newImages.desktop;
    if (newImages.mobile.length > 0) req.body.images.mobile = newImages.mobile;

    // 3. Partial Zod Validation
    const result = productValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    // 4. Update data object (merge retained + new desktop images)
    const updateData = { ...result.data };
    const MAX_DESKTOP_IMAGES = 5;

    let retainedDesktop = product.images.desktop || [];
    if (req.body.retainedDesktopImages) {
      try {
        const parsed = JSON.parse(req.body.retainedDesktopImages);
        if (Array.isArray(parsed)) {
          retainedDesktop = parsed.filter((url) =>
            product.images.desktop.includes(url),
          );
        }
      } catch {
        // ignore invalid JSON
      }
    }

    const finalDesktop = [...retainedDesktop, ...newImages.desktop].slice(
      0,
      MAX_DESKTOP_IMAGES,
    );

    if (req.body.retainedDesktopImages || newImages.desktop.length > 0) {
      if (finalDesktop.length === 0) {
        const uploadedPaths = getUploadedFilesPaths(req.files);
        await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
        return res.status(400).json({
          message: "Please provide at least one product image.",
        });
      }

      updateData.images = {
        desktop: finalDesktop,
        mobile: updateData.images?.mobile || product.images.mobile,
      };
    } else if (updateData.images) {
      updateData.images = {
        desktop: updateData.images.desktop || product.images.desktop,
        mobile: updateData.images.mobile || product.images.mobile,
      };
    }

    // 5. Unique Checks (Slug & SKU for other products)
    if (updateData.slug || updateData.sku) {
      const existingProduct = await Product.findOne({
        $or: [{ slug: updateData.slug }, { sku: updateData.sku }],
        _id: { $ne: id },
      });

      if (existingProduct) {
        const uploadedPaths = getUploadedFilesPaths(req.files);
        await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
        return res
          .status(409)
          .json({ message: "Slug or SKU already in use by another product" });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }, // 'new: true' is standard mongoose
    )
      .populate("categoryId", "name image")
      .lean();

    // 6. Jo images product se hata gayi, unki files delete karein
    if (updateData.images?.desktop) {
      const removedDesktop = product.images.desktop.filter(
        (img) => !updateData.images.desktop.includes(img),
      );
      await Promise.all(removedDesktop.map(deleteImageFile));
    }
    if (newImages.mobile.length > 0) {
      await Promise.all(product.images.mobile.map(deleteImageFile));
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    const uploadedPaths = getUploadedFilesPaths(req.files);
    await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   DELETE PRODUCT
========================================================= */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(id);

    // Product ki saari nested local images delete karo
    const allImages = [
      ...(product.images?.desktop || []),
      ...(product.images?.mobile || []),
    ];
    await Promise.all(allImages.map((img) => deleteImageFile(img)));

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   🆕 BULK CREATE PRODUCTS (CSV Upload)
   -------------------------------------------------------
   PRIMARY: Category Dropdown Method — req.body.categoryId har
   row ka default category hai (admin UI se select hota hai).
   FALLBACK: Optional 'category_name' column — agar diya gaya aur
   DB se match hua to us row par dropdown override ho jayega
   (ek hi file me mixed categories bhi upload ho sakti hain).

   Required columns : name, description, price, stock, images
   Optional columns : brand, subCategory, discountPrice, sku,
                      mobileImages, category_name, isActive,
                      isFeatured, isBestSeller, isNewArrival

   - slug naam se auto-generate (+ uniqueness suffix)
   - SKU missing ho to auto-generate; duplicate SKU rows skip
   - images column: comma-separated URLs / /uploads/... paths
========================================================= */
export const bulkCreateProducts = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ message: "CSV file is required (form field: 'file')" });
    }

    const MAX_ROWS = 300;
    const { categoryId } = req.body;

    // 1. Dropdown wali category validate karo
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Valid categoryId is required" });
    }
    const defaultCategory = await Category.findById(categoryId).lean();
    if (!defaultCategory) {
      return res.status(404).json({ message: "Selected category not found" });
    }

    // 2. CSV parse + header check
    const rows = csvToObjects(req.file.buffer.toString("utf8"));
    if (!rows.length) {
      return res
        .status(400)
        .json({ message: "CSV is empty or has no data rows" });
    }

    const REQUIRED_COLUMNS = ["name", "description", "price", "stock", "images"];
    const missingColumn = REQUIRED_COLUMNS.find((col) => !(col in rows[0]));
    if (missingColumn) {
      return res.status(400).json({
        message: `Missing required column '${missingColumn}'. Required columns: ${REQUIRED_COLUMNS.join(", ")}`,
      });
    }
    if (rows.length > MAX_ROWS) {
      return res
        .status(400)
        .json({ message: `Too many rows — maximum ${MAX_ROWS} per file` });
    }

    // 3. category_name fallback ke liye saari categories ki lookup map
    const allCategories = await Category.find({}).select("name").lean();
    const categoryByName = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c._id]),
    );

    // 4. Existing slug/sku sets — dedupe fast rahe
    const existingProducts = await Product.find({}).select("slug sku").lean();
    const usedSlugs = new Set(existingProducts.map((p) => p.slug));
    const usedSkus = new Set(existingProducts.map((p) => p.sku));

    const uniqueSlug = (base) => {
      let candidate = base;
      let counter = 2;
      while (usedSlugs.has(candidate)) {
        candidate = `${base}-${counter}`;
        counter += 1;
      }
      usedSlugs.add(candidate);
      return candidate;
    };

    const generateSku = () => {
      let sku;
      do {
        sku = `NB-${Date.now().toString(36).toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;
      } while (usedSkus.has(sku));
      usedSkus.add(sku);
      return sku;
    };

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

      // --- Required fields ---
      if (!name) return fail("'name' is required");

      const description = (row.description || "").trim();
      if (description.length < 10)
        return fail("'description' must be at least 10 characters");

      const price = Number(row.price);
      if (!Number.isFinite(price) || price < 0)
        return fail("Valid numeric 'price' is required");

      const stockRaw = String(row.stock ?? "").trim();
      const stock = stockRaw === "" ? 0 : Number(stockRaw);
      if (!Number.isFinite(stock) || stock < 0)
        return fail("'stock' must be 0 or a positive number");

      const desktop = (row.images || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!desktop.length)
        return fail(
          "'images' required — comma-separated image URLs/paths (at least one)",
        );
      const mobile = String(row.mobileimages || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // --- Optional: discount ---
      let discountPrice = null;
      const discountRaw = String(row.discountprice ?? "").trim();
      if (discountRaw !== "") {
        discountPrice = Number(discountRaw);
        if (!Number.isFinite(discountPrice) || discountPrice < 0)
          return fail("'discountPrice' must be a positive number");
        if (discountPrice >= price)
          return fail("'discountPrice' must be less than 'price'");
      }

      // --- Category resolve: dropdown default → category_name override ---
      let rowCategoryId = defaultCategory._id;
      const catName = (row.category_name || "").trim();
      if (catName) {
        const matched = categoryByName.get(catName.toLowerCase());
        if (!matched)
          return fail(`category_name '${catName}' did not match any category`);
        rowCategoryId = matched;
      }

      // --- Sub-category ---
      const subCategory = (row.subcategory || "").trim();
      if (subCategory && !["Men", "Women", "Unisex"].includes(subCategory))
        return fail("'subCategory' must be Men, Women or Unisex");

      // --- SKU: diya gaya ho to uniqueness check, warna auto-generate ---
      let sku = (row.sku || "").trim().toUpperCase();
      if (sku) {
        if (usedSkus.has(sku)) {
          skipped += 1;
          return fail(`SKU '${sku}' already exists`, true);
        }
        usedSkus.add(sku);
      } else {
        sku = generateSku();
      }

      // --- Slug ---
      const baseSlug = slugify(name);
      if (!baseSlug) return fail("Name se valid slug generate nahi ho paya");

      docs.push({
        categoryId: rowCategoryId,
        name,
        slug: uniqueSlug(baseSlug),
        description,
        brand: (row.brand || "").trim(),
        subCategory: subCategory || "Unisex",
        images: { desktop, mobile },
        price,
        discountPrice,
        sku,
        stock,
        isActive: toBool(row.isactive, true),
        isFeatured: toBool(row.isfeatured, false),
        isBestSeller: toBool(row.isbestseller, false),
        isNewArrival: toBool(row.isnewarrival, false),
      });
    });

    let inserted = [];
    if (docs.length) {
      inserted = await Product.insertMany(docs, { ordered: false });
    }

    return res.status(200).json({
      message: `Bulk upload complete — ${inserted.length} created, ${duplicates.length} duplicates skipped, ${invalidRows.length} invalid rows`,
      totalRows: rows.length,
      insertedCount: inserted.length,
      skippedDuplicates: duplicates.length,
      invalidRowCount: invalidRows.length,
      invalidRows,
      duplicates,
      products: inserted,
    });
  } catch (error) {
    console.error("Bulk Create Products Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

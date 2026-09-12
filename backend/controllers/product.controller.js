import mongoose from "mongoose";
import {
  productValidationSchema,
  productUpdateSchema,
} from "../validators/productValidate.js";
import { Category } from "../models/category.model.js";
import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import { buildCollectionsCondition } from "../utils/collectionMatcher.js";
import { csvToObjects, slugify, toBool } from "../utils/csvParser.js";
import { deleteFile as deleteFromCloudinary } from "../utils/storage.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { splitByModelValidation } from "../utils/validateDoc.js";

/* =========================================================
   HELPER FUNCTIONS
========================================================= */
// 🆕 'variantImages' me aayi jo files kisi variant row me assign nahi hui
// (newImageCount se zyada files, naam-less row, ya variants JSON absent/invalid)
// wo DB me save nahi hoti — unhe Cloudinary se hata do, warna orphan reh jaati hain.
const deleteUnassignedVariantUploads = async (uploadedFiles = [], variants = []) => {
  const assigned = new Set(variants.flatMap((v) => v.images || []));
  const unassigned = uploadedFiles
    .map((f) => f.path)
    .filter((p) => !assigned.has(p));
  await Promise.all(unassigned.map(deleteFromCloudinary));
};

// 🆕 Variant rows ke saath uploaded variant images distribute karo.
// Admin FormData me har variant row { name, images (retained URLs),
// newImageCount } bhejta hai aur files 'variantImages' field me row-order
// me aati hain — queue se sequentially utha kar rows me baantte hain.
// existingImages = product ke variants me pehle se saved URLs. Retained images
// sirf inme se ho sakti hain — body se aayi arbitrary URL (jo baad me remove
// hone par kisi aur asset ko Cloudinary se delete kar deti) ignore hoti hai.
const buildVariantImages = (
  variantRows,
  uploadedFiles = [],
  existingImages = new Set(),
) => {
  let queue = [...uploadedFiles];
  return variantRows
    .map((v) => {
      // Queue pehle consume karo — naam-less row ki files agli row me shift na hon
      const count = Number(v?.newImageCount || 0);
      const safeCount = Number.isFinite(count) && count > 0 ? count : 0;
      const newPaths = queue
        .slice(0, safeCount)
        .map((f) => f.path);
      queue = queue.slice(safeCount);
      const name = String(v?.name || "").trim();
      if (!name) return null;
      return {
        name,
        images: [
          ...(Array.isArray(v?.images)
            ? v.images.filter((img) => existingImages.has(img))
            : []),
          ...newPaths,
        ],
      };
    })
    .filter(Boolean);
};

// 🆕 FormData me variants JSON string aata hai — parse karke rows wapas
// do. Parse fail ho toh undefined (field absent = variants untouched).
const parseVariantsFromBody = (body) => {
  let raw = body.variants;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return Array.isArray(raw) ? raw : undefined;
};


// 🆕 FormData me collections JSON string aata hai — parse karke valid
// ObjectId strings ki deduped array banao. Absent/invalid = undefined
// (update me collections untouched rahenge, create me default [] lagega).
const parseCollectionsFromBody = (body) => {
  let raw = body.collections;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set();
  const ids = [];
  raw.forEach((id) => {
    const s = String(id || "").trim();
    if (mongoose.Types.ObjectId.isValid(s) && !seen.has(s)) {
      seen.add(s);
      ids.push(s);
    }
  });
  return ids;
};

// 🆕 Sirf wahi collections rakho jo Collections section me sach me exist
// karti hain — deleted/invalid ids silently drop ho jaati hain.
const filterExistingCollections = async (ids = []) => {
  if (!ids.length) return [];
  const existing = await Collection.find({ _id: { $in: ids } })
    .select("_id")
    .lean();
  const validIds = new Set(existing.map((c) => String(c._id)));
  return ids.filter((id) => validIds.has(String(id)));
};

// Form-data/Multer ke baad saari uploaded files ko ek flat array me laane ka helper (Delete/cleanup karne ke liye)
const getUploadedFilesPaths = (files) => {
  if (!files) return [];
  const paths = [];
  if (files.desktopImages)
    paths.push(...files.desktopImages.map((f) => f.path));
  if (files.mobileImages)
    paths.push(...files.mobileImages.map((f) => f.path));
  if (files.variantImages)
    paths.push(...files.variantImages.map((f) => f.path));
  return paths;
};

// Request se images extract karke schema format me badalna
const extractImages = (req) => {
  const images = { desktop: [], mobile: [] };

  if (req.files) {
    if (req.files.desktopImages) {
      images.desktop = req.files.desktopImages.map((file) => file.path);
    }
    if (req.files.mobileImages) {
      images.mobile = req.files.mobileImages.map((file) => file.path);
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
    // Sale price clear bhi kar sakte hain — empty/0 → null
    if (req.body.discountPrice !== undefined)
      req.body.discountPrice = Number(req.body.discountPrice) || null;
    if (req.body.stock) req.body.stock = Number(req.body.stock);
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // 2. Images extract karna
    req.body.images = extractImages(req);

    // 2b. 🆕 Variants parse + uploaded variant images distribute karna
    const variantRows = parseVariantsFromBody(req.body);
    if (variantRows !== undefined) {
      req.body.variants = buildVariantImages(
        variantRows,
        req.files?.variantImages || [],
      );
    } else {
      delete req.body.variants; // invalid/absent — schema default [] use hoga
    }

    // 2c. 🆕 Collections parse — Collections section se linked ids
    const parsedCollections = parseCollectionsFromBody(req.body);
    if (parsedCollections !== undefined) {
      req.body.collections = parsedCollections;
    } else {
      delete req.body.collections; // absent — schema default [] use hoga
    }

    // 3. Zod Validation
    const result = productValidationSchema.safeParse(req.body);

    if (!result.success) {
      // Validation fail - uploaded files delete karo
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));

      return res.status(400).json({
        message: result.error.issues[0].message,
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { categoryId, slug, sku } = result.data;

    // 4. Category Check
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const categoryExists = await Category.findById(categoryId).lean();
    if (!categoryExists) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
      return res.status(404).json({ message: "Category not found" });
    }

    // 5b. 🆕 Collections — sirf existing (Collections section wali) ids rakho
    if (result.data.collections?.length) {
      result.data.collections = await filterExistingCollections(
        result.data.collections,
      );
    }

    // 5. Unique Check (Slug & SKU)
    const existingProduct = await Product.findOne({ $or: [{ slug }, { sku }] });
    if (existingProduct) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
      return res.status(409).json({
        message:
          existingProduct.slug === slug
            ? "Product slug already exists"
            : "Product SKU already exists",
      });
    }

    // 6. Create Product
    const product = await Product.create(result.data);

    // 🆕 Variant uploads jo kisi row me assign nahi hui — Cloudinary se hatao
    await deleteUnassignedVariantUploads(
      req.files?.variantImages,
      result.data.variants,
    );

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    const uploadedPaths = getUploadedFilesPaths(req.files);
    await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
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
      gender: genderParam,
      subCategory: legacySubCategory,
      collections,
      homeFeatured,
      onSale,
      isActive,
      inStock,
      color,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    const andConditions = [];

    // Multiple category support — comma-separated IDs (sirf valid ObjectIds allow karo taaki CastError na aaye)
    if (categoryId) {
      const ids = String(categoryId)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (ids.length > 0) {
        filter.categoryId = ids.length > 1 ? { $in: ids } : ids[0];
      } else {
        // Agar categoryId di gayi par koi valid id nahi thi, toh empty result match
        filter.categoryId = new mongoose.Types.ObjectId();
      }
    }

    // Gender filter — comma-separated (Men, Women)
    // Purana `subCategory` query param bhi backward-compat ke liye accept
    const gender = genderParam ?? legacySubCategory;
    if (gender) {
      filter.gender = { $in: String(gender).split(",").filter(Boolean) };
    }

    // 🆕 Home page curation — homeFeatured=true → sirf un collections ke
    // products jin par admin ne "Show this collection on the home page"
    // checkbox lagaya hai (home ka Featured Pieces section inhi se bharta hai).
    // Koi collection feature nahi hui → empty array; storefront apna
    // fallback use karta hai.
    if (homeFeatured === "true") {
      filter.isActive = true; // homepage par sirf live products

      const featuredCols = await Collection.find({
        showOnHomePage: true,
        isActive: true,
      })
        .select("_id")
        .lean();

      if (!featuredCols.length) {
        return res.status(200).json({
          message: "No collection is featured on the home page",
          pagination: {
            currentPage: Number(page),
            totalPages: 0,
            totalProducts: 0,
            limit: Number(limit),
            hasNextPage: false,
            hasPrevPage: false,
          },
          availableColors: [],
          products: [],
        });
      }

      const condition = await buildCollectionsCondition(
        Collection,
        featuredCols.map((c) => c._id),
      );
      if (!condition) {
        return res.status(200).json({
          message: "No products matched the featured collections",
          pagination: {
            currentPage: Number(page),
            totalPages: 0,
            totalProducts: 0,
            limit: Number(limit),
            hasNextPage: false,
            hasPrevPage: false,
          },
          availableColors: [],
          products: [],
        });
      }
      andConditions.push(condition);
    }

    // 🆕 Collections filter — comma-separated collection (category) ids.
    // Shop page ka dynamic "Collections" filter isi param se chalta hai.
    if (collections) {
      const colIds = String(collections)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (colIds.length) {
        const includeInactive = req.query.includeInactive === "true";
        const condition = await buildCollectionsCondition(Collection, colIds, {
          includeInactive,
        });
        if (condition) andConditions.push(condition);
      }
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

    // 🆕 Availability filter — sirf in-stock products
    if (inStock === "true") filter.stock = { $gt: 0 };

    // 🆕 Color filter — variants.name match (case-insensitive, multi-select)
    if (color) {
      const colorRegexes = String(color)
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => new RegExp(`^${escapeRegex(c)}$`, "i"));
      if (colorRegexes.length) {
        andConditions.push({
          variants: { $elemMatch: { name: { $in: colorRegexes } } },
        });
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      // Escape karo — raw search string invalid regex ban sakta hai
      const safeSearch = escapeRegex(String(search));
      andConditions.push({
        $or: [
          { name: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
          { brand: { $regex: safeSearch, $options: "i" } },
        ],
      });
    }

    // Search $or aur collection $or ko merge karne ke liye $and use karo
    if (andConditions.length) filter.$and = andConditions;

    const sortOptions = { [sort]: order === "asc" ? 1 : -1 };

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name image") // Corrected populate reference
        .populate("collections", "name slug showAsBadge") // 🆕 Collections section names
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum);

    // 🆕 Shop filter UI ke liye — active products ke distinct variant colors
    let availableColors = [];
    if (isActive === "true") {
      const variantDocs = await Product.find({
        isActive: true,
        "variants.0": { $exists: true },
      })
        .select("variants")
        .lean();
      availableColors = [
        ...new Set(
          variantDocs
            .flatMap((p) => (p.variants || []).map((v) => v?.name))
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b));
    }

    return res.status(200).json({
      message: "Products fetched successfully",
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      availableColors,
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
      .populate("collections", "name slug showAsBadge") // 🆕 Collections section names
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
      await Promise.all(getUploadedFilesPaths(req.files).map(deleteFromCloudinary));
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      await Promise.all(getUploadedFilesPaths(req.files).map(deleteFromCloudinary));
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. Parse incoming FormData
    if (req.body.price) req.body.price = Number(req.body.price);
    // Sale price clear bhi kar sakte hain — empty/0 → null
    if (req.body.discountPrice !== undefined)
      req.body.discountPrice = Number(req.body.discountPrice) || null;
    if (req.body.stock) req.body.stock = Number(req.body.stock);
    if (req.body.isActive === "true") req.body.isActive = true;
    if (req.body.isActive === "false") req.body.isActive = false;

    // 2. Extract new images — images sirf upload se aati hain; JSON body ki
    // arbitrary `images` ignore (retained desktop images niche merge hoti hain)
    delete req.body.images;
    const newImages = extractImages(req);

    // Agar kisi device type ki nayi file aayi hai, TABHI images body me bhejein.
    // Khali {} bhejne par zod ka images.desktop (required array) undefined par
    // fail hota hai: "expected array, received undefined". No-upload edit me
    // images key absent rehne do - partial() use skip karega aur retained
    // images niche ke merge logic se hi final images banengi.
    if (newImages.desktop.length > 0 || newImages.mobile.length > 0) {
      req.body.images = {};
      if (newImages.desktop.length > 0)
        req.body.images.desktop = newImages.desktop;
      if (newImages.mobile.length > 0)
        req.body.images.mobile = newImages.mobile;
    }

    // 2b. 🆕 Variants parse — FormData me JSON string aata hai.
    // Absent/invalid = variants untouched (partial update me wipe na ho).
    const variantRows = parseVariantsFromBody(req.body);
    if (variantRows !== undefined) {
      req.body.variants = buildVariantImages(
        variantRows,
        req.files?.variantImages || [],
        new Set((product.variants || []).flatMap((v) => v.images || [])),
      );
    } else {
      delete req.body.variants;
    }

    // 2c. 🆕 Collections parse — absent/invalid = untouched (wipe na ho);
    // present (even empty array) = collections replace ho jaayengi.
    const parsedCollections = parseCollectionsFromBody(req.body);
    if (parsedCollections !== undefined) {
      req.body.collections = await filterExistingCollections(parsedCollections);
    } else {
      delete req.body.collections;
    }

    // 3. Partial Zod Validation
    const result = productUpdateSchema.safeParse(req.body);

    if (!result.success) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    // 4. Update data object (merge retained + new desktop images)
    // 🛠️ DEFAULT-LEAK GUARD — partial() + default(): missing fields me
    // defaults (gender=["Men"], stock=0, isActive=true...) inject hokar
    // existing values wipe na hon. Sirf request me bheji fields rakho.
    const updateData = {};
    Object.keys(result.data).forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = result.data[key];
    });

    // 🆕 Variants partial-update guard — request me variants nahi bheje toh
    // zod ka default [] purane variants wipe kar dega; usko roko.
    if (req.body.variants === undefined) {
      delete updateData.variants;
    }

    // Ensure discountPrice is strictly less than price (combining updated + existing values)
    const effectivePrice =
      updateData.price !== undefined ? updateData.price : product.price;
    const effectiveDiscountPrice =
      updateData.discountPrice !== undefined
        ? updateData.discountPrice
        : product.discountPrice;

    if (
      effectiveDiscountPrice !== null &&
      effectiveDiscountPrice !== undefined &&
      effectivePrice !== null &&
      effectivePrice !== undefined
    ) {
      if (effectiveDiscountPrice >= effectivePrice) {
        const uploadedPaths = getUploadedFilesPaths(req.files);
        await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
        return res.status(400).json({
          message: "Sale price must be less than the regular price",
        });
      }
    }

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

    // MAX_DESKTOP_IMAGES cap se bahar reh gayi nayi uploads kabhi save nahi
    // hongi — Cloudinary par orphan na rahein
    const droppedDesktopUploads = newImages.desktop.filter(
      (img) => !finalDesktop.includes(img),
    );
    await Promise.all(droppedDesktopUploads.map(deleteFromCloudinary));

    if (req.body.retainedDesktopImages || newImages.desktop.length > 0) {
      if (finalDesktop.length === 0) {
        const uploadedPaths = getUploadedFilesPaths(req.files);
        await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
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
    const orConditions = [];
    if (updateData.slug) orConditions.push({ slug: updateData.slug });
    if (updateData.sku) orConditions.push({ sku: updateData.sku });

    if (orConditions.length > 0) {
      const existingProduct = await Product.findOne({
        $or: orConditions,
        _id: { $ne: id },
      });

      if (existingProduct) {
        const uploadedPaths = getUploadedFilesPaths(req.files);
        await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
        return res
          .status(409)
          .json({
            message:
              existingProduct.slug === updateData.slug
                ? "Product slug already exists"
                : "Product SKU already exists",
          });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        returnDocument: "after",
        runValidators: true, // updated document return hota hai
      },
    )
      .populate("categoryId", "name image")
      .lean();

    // 6. Jo images product se hata gayi, unki files delete karein
    if (updateData.images?.desktop) {
      const removedDesktop = product.images.desktop.filter(
        (img) => !updateData.images.desktop.includes(img),
      );
      await Promise.all(removedDesktop.map(deleteFromCloudinary));
    }
    if (newImages.mobile.length > 0) {
      await Promise.all(product.images.mobile.map(deleteFromCloudinary));
    }

    // 🆕 Jo variant images final set me nahi rahi, unki files delete karo
    if (updateData.variants) {
      const finalVariantImages = new Set(
        updateData.variants.flatMap((v) => v.images || []),
      );
      const removedVariantImages = (product.variants || [])
        .flatMap((v) => v.images || [])
        .filter((img) => img && !finalVariantImages.has(img));
      await Promise.all(removedVariantImages.map(deleteFromCloudinary));
    }

    // 🆕 Variant uploads jo kisi row me assign nahi hui — Cloudinary se hatao
    await deleteUnassignedVariantUploads(
      req.files?.variantImages,
      updateData.variants,
    );

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    const uploadedPaths = getUploadedFilesPaths(req.files);
    await Promise.all(uploadedPaths.map((img) => deleteFromCloudinary(img)));
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   RESTORE PRODUCT (undo soft delete)
========================================================= */
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: true },
      { returnDocument: "after" },
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product restored successfully",
      product,
    });
  } catch (error) {
    console.error("Restore Product Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================================================
   DELETE PRODUCT (SOFT DELETE)
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

    // SOFT delete — storefront se sirf hide hota hai.
    // Disk images aur order history dono safe rehte hain; admin
    // PATCH /admin/:id/restore se wapas live kar sakta hai.
    await Product.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json({
      message: "Product hidden from storefront (soft deleted)",
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
   Optional columns : brand, gender, discountPrice, sku,
                      mobileImages, category_name, isActive

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

      // --- Gender - "Men", "Women" ya comma-separated "Men,Women" ---
      // (purana 'subcategory' column bhi backward-compat ke liye accept)
      const genders = (row.gender ?? row.subcategory ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v === "Men" || v === "Women");
      if ((row.gender ?? row.subcategory ?? "").trim() && genders.length === 0)
        return fail(
          "'gender' must be Men, Women or comma-separated (Men,Women)",
        );

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

      const doc = {
        categoryId: rowCategoryId,
        name,
        slug: uniqueSlug(baseSlug),
        description,
        brand: (row.brand || "").trim(),
        gender: genders.length ? genders : ["Men"],
        images: { desktop, mobile },
        price,
        discountPrice,
        sku,
        stock,
        isActive: toBool(row.isactive, true),
      };

      docs.push({ row: rowNo, name, doc });
    });

    // Model rules (name 3-200 chars etc.) — insertMany ordered:false invalid
    // docs chupchaap drop kar deta, isliye insert se pehle check karke report karo
    const { validDocs, invalidRows: modelInvalidRows } =
      await splitByModelValidation(Product, docs);
    invalidRows.push(...modelInvalidRows);
    invalidRows.sort((a, b) => a.row - b.row);

    let inserted = [];
    if (validDocs.length) {
      inserted = await Product.insertMany(validDocs, { ordered: false });
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

/* =========================================================
   QUICK UPDATE PRODUCT STOCK (Admin Only)
   PATCH /api/products/admin/:id/stock
   Body: { stock?: number, delta?: number }
========================================================= */
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const hasStock =
      stock !== undefined && stock !== null && stock !== "" && !isNaN(Number(stock));
    const hasDelta =
      delta !== undefined && delta !== null && delta !== "" && !isNaN(Number(delta));
    if (!hasStock && !hasDelta) {
      return res.status(400).json({ message: "Please provide valid stock or delta" });
    }

    // 🛠️ Atomic update — read-modify-write nahi. Delta seedha DB ke current
    // stock par lagta hai, taaki beech me aaye order ka $inc overwrite na ho.
    const update = hasStock
      ? { $set: { stock: Math.max(0, Math.floor(Number(stock))) } }
      : [
          {
            $set: {
              stock: {
                $max: [
                  0,
                  { $add: [{ $ifNull: ["$stock", 0] }, Math.floor(Number(delta))] },
                ],
              },
            },
          },
        ];

    const updatedProduct = await Product.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      updatePipeline: !hasStock,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: `Stock updated successfully for ${updatedProduct.name} (New Stock: ${updatedProduct.stock})`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Stock Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { productValidationSchema } from "../validators/productValidate.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

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
  if (files.tabletImages)
    paths.push(
      ...files.tabletImages.map((f) => `/uploads/products/${f.filename}`),
    );
  if (files.mobileImages)
    paths.push(
      ...files.mobileImages.map((f) => `/uploads/products/${f.filename}`),
    );
  return paths;
};

// Request se images extract karke schema format me badalna
const extractImages = (req) => {
  const images = { desktop: [], tablet: [], mobile: [] };

  if (req.files) {
    if (req.files.desktopImages) {
      images.desktop = req.files.desktopImages.map(
        (file) => `/uploads/products/${file.filename}`,
      );
    }
    if (req.files.tabletImages) {
      images.tablet = req.files.tabletImages.map(
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
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    // Use categoryId based on schema
    if (categoryId) filter.categoryId = categoryId;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

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

    // 2. Extract new images
    const newImages = extractImages(req);

    // Agar kisi device type ki nayi file aayi hai, toh usko body me append karein
    if (!req.body.images) req.body.images = {};
    if (newImages.desktop.length > 0)
      req.body.images.desktop = newImages.desktop;
    if (newImages.tablet.length > 0) req.body.images.tablet = newImages.tablet;
    if (newImages.mobile.length > 0) req.body.images.mobile = newImages.mobile;

    // 3. Partial Zod Validation
    const result = productValidationSchema.partial().safeParse(req.body);

    if (!result.success) {
      const uploadedPaths = getUploadedFilesPaths(req.files);
      await Promise.all(uploadedPaths.map((img) => deleteImageFile(img)));
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    // 4. Update data object (Merge existing images if not updated)
    const updateData = { ...result.data };

    if (updateData.images) {
      updateData.images = {
        desktop: updateData.images.desktop || product.images.desktop,
        tablet: updateData.images.tablet || product.images.tablet,
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

    // 6. Nayi images aane par purani images delete karein
    if (newImages.desktop.length > 0)
      await Promise.all(product.images.desktop.map(deleteImageFile));
    if (newImages.tablet.length > 0)
      await Promise.all(product.images.tablet.map(deleteImageFile));
    if (newImages.mobile.length > 0)
      await Promise.all(product.images.mobile.map(deleteImageFile));

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
      ...(product.images?.tablet || []),
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

import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import {
  createProductSchema,
  getProductsSchema,
} from "../validators/productValidator.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

const deleteImageFile = async (imagePath) => {
  if (!imagePath) return;

  // External URL hai toh delete mat karo
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

const extractImages = (req) => {
  // Agar files upload hue hain (form-data)
  if (req.files && req.files.length > 0) {
    return req.files.map((file) => `/uploads/products/${file.filename}`);
  }

  // Agar JSON se images array aayi hai (URLs)
  if (req.body.images) {
    // JSON parse karo agar string hai
    if (typeof req.body.images === "string") {
      try {
        const parsed = JSON.parse(req.body.images);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Single URL string hai
        return [req.body.images];
      }
    }

    // Already array hai
    if (Array.isArray(req.body.images)) {
      return req.body.images;
    }
  }

  return [];
};

export const createProduct = async (req, res) => {
  try {
    // Images extract karo (file ya URL)
    const images = extractImages(req);

    const productData = {
      name: req.body.name,
      description: req.body.description || "",
      price: Number(req.body.price),
      category: req.body.category,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined,
      status: req.body.status,
      images,
    };

    const result = createProductSchema.safeParse(productData);

    if (!result.success) {
      // Validation fail - uploaded files delete karo
      if (req.files && req.files.length > 0) {
        await Promise.all(images.map((img) => deleteImageFile(img)));
      }

      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { name, description, price, category } = result.data;

    if (!mongoose.Types.ObjectId.isValid(category)) {
      if (req.files && req.files.length > 0) {
        await Promise.all(images.map((img) => deleteImageFile(img)));
      }

      return res.status(400).json({
        message: "Invalid category ID",
      });
    }

    const categoryExists = await Category.findById(category).lean();

    if (!categoryExists) {
      if (req.files && req.files.length > 0) {
        await Promise.all(images.map((img) => deleteImageFile(img)));
      }

      return res.status(404).json({
        message: "Category not found",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: result.data.stock,
      status: result.data.status,
      images: result.data.images,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    // Error aaya toh uploaded files delete karo
    if (req.files && req.files.length > 0) {
      const images = req.files.map(
        (file) => `/uploads/products/${file.filename}`,
      );
      await Promise.all(images.map((img) => deleteImageFile(img)));
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const result = getProductsSchema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { page, limit, sort, order, category, minPrice, maxPrice, search } =
      result.data;

    const skip = (page - 1) * limit;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        filter.price.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        filter.price.$lte = maxPrice;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {
      [sort]: order === "asc" ? 1 : -1,
    };

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name image")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      message: "Products fetched successfully",

      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },

      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id)
      .populate("category", "name description image")
      .lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Nayi images extract karo
    const newImages = extractImages(req);

    const updateData = {
      ...req.body,
    };

    // Agar nayi images aayi hain toh update karo
    if (newImages.length > 0) {
      updateData.images = newImages;
    }

    // Price ko number mein convert karo
    if (updateData.price) {
      updateData.price = Number(updateData.price);
    }

    const result = createProductSchema.partial().safeParse(updateData);

    if (!result.success) {
      // Validation fail - nayi uploaded files delete karo
      if (req.files && req.files.length > 0) {
        await Promise.all(newImages.map((img) => deleteImageFile(img)));
      }

      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    if (result.data.category) {
      if (!mongoose.Types.ObjectId.isValid(result.data.category)) {
        if (req.files && req.files.length > 0) {
          await Promise.all(newImages.map((img) => deleteImageFile(img)));
        }

        return res.status(400).json({
          message: "Invalid category ID",
        });
      }

      const categoryExists = await Category.findById(
        result.data.category,
      ).lean();

      if (!categoryExists) {
        if (req.files && req.files.length > 0) {
          await Promise.all(newImages.map((img) => deleteImageFile(img)));
        }

        return res.status(404).json({
          message: "Category not found",
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: result.data },
      { returnDocument: "after", runValidators: true },
    )
      .populate("category", "name image")
      .lean();

    // Agar nayi local files aayi hain toh purani local images delete karo
    if (req.files && req.files.length > 0 && product.images.length > 0) {
      await Promise.all(product.images.map((img) => deleteImageFile(img)));
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(
        (file) => `/uploads/products/${file.filename}`,
      );
      await Promise.all(newImages.map((img) => deleteImageFile(img)));
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(id);

    // Product ki saari local images delete karo
    if (product.images && product.images.length > 0) {
      await Promise.all(product.images.map((img) => deleteImageFile(img)));
    }

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

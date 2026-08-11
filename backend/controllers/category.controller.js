import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { categorySchema } from "../validators/category.validator.js";

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

export const createCategory = async (req, res) => {
  try {
    let image = "";
    if (req.file) {
      image = `/uploads/categories/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }

    const categoryData = {
      name: req.body.name,
      description: req.body.description || "",
      image,
      status: req.body.status || "active",
    };

    const result = categorySchema.safeParse(categoryData);

    if (!result.success) {
      if (req.file) {
        await deleteImageFile(image);
      }

      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { name, description } = result.data;

    const existingCategory = await Category.findOne({
      name: {
        $regex: new RegExp(`^${name}$`, "i"),
      },
    }).lean();

    if (existingCategory) {
      if (req.file) {
        await deleteImageFile(image);
      }

      return res.status(409).json({
        message: "Category with this name already exists",
      });
    }

    const category = await Category.create({
      name,
      description,
      image,
      status: result.data.status,
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

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      message: "Categories fetched successfully",
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id).lean();

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

    let newImage = category.image;

    if (req.file) {
      newImage = `/uploads/categories/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      newImage = req.body.image;
    }

    const updateData = {
      ...req.body,
      image: newImage,
    };

    const result = categorySchema.partial().safeParse(updateData);

    if (!result.success) {
      if (req.file) {
        await deleteImageFile(newImage);
      }
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    if (
      result.data.name &&
      result.data.name.toLowerCase() !== category.name.toLowerCase()
    ) {
      const existingCategory = await Category.findOne({
        name: {
          $regex: new RegExp(`^${result.data.name}$`, "i"),
        },
      }).lean();

      if (existingCategory) {
        if (req.file) {
          await deleteImageFile(newImage);
        }
        return res.status(409).json({
          message: "Category with this name already exists",
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: result.data },
      { returnDocument: "after", runValidators: true },
    ).lean();

    // Agar nayi image aayi hai aur purani local image thi, toh purani delete kar do
    if (newImage !== category.image && category.image) {
      await deleteImageFile(category.image);
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);
    if (req.file) {
      await deleteImageFile(`/uploads/categories/${req.file.filename}`);
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const productsCount = await Product.countDocuments({ category: id });

    if (productsCount > 0) {
      return res.status(409).json({
        message: `Cannot delete category. It is linked to ${productsCount} product(s).`,
      });
    }

    await Category.findByIdAndDelete(id);

    if (category.image) {
      await deleteImageFile(category.image);
    }

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCategoryProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return res.status(404).json({ message: "Invalid category ID" });
    }

    const products = await Product.find({ category: id })
      .populate("category", "name image")
      .sort({ createdAt: -1 })
      .lean();

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

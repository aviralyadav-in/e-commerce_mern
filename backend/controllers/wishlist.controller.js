import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

/* =========================================================
   1. TOGGLE WISHLIST (User Side) - Add/Remove Product
========================================================= */
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    // Check if product exists
    const productExists = await Product.findById(productId);
    if (!productExists || !productExists.isActive) {
      return res.status(404).json({ message: "Product not found or inactive" });
    }

    // Find user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Naya wishlist bana do
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    // Check agar product already wishlist me hai
    const productIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId,
    );

    let action;
    if (productIndex > -1) {
      // Product pehle se hai -> Remove karo
      wishlist.products.splice(productIndex, 1);
      action = "removed";
    } else {
      // Product nahi hai -> Add karo
      wishlist.products.push({ product: productId });
      action = "added";
    }

    await wishlist.save();

    // Populate karke return karo
    await wishlist.populate("products.product", "name images price");

    return res.status(200).json({
      message: `Product ${action} ${action === "added" ? "to" : "from"} wishlist`,
      wishlist,
      action,
    });
  } catch (error) {
    console.error("Toggle Wishlist Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET USER WISHLIST (User Side)
========================================================= */
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products.product",
      "name images price discountPrice stock",
    );

    if (!wishlist) {
      return res.status(200).json({
        message: "Wishlist is empty",
        wishlist: { products: [] },
      });
    }

    return res.status(200).json({
      message: "Wishlist fetched successfully",
      wishlist,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. GET ALL WISHLISTS (Admin Side) - Sabhi users ki wishlists
========================================================= */
export const getAllWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate("user", "name email phone")
      .populate("products.product", "name images price discountPrice stock")
      .sort({ updatedAt: -1 });

    // Flat structure banao taaki admin table me easily dikha sake
    const flatData = [];
    wishlists.forEach((wishlist) => {
      if (wishlist.user && wishlist.products.length > 0) {
        wishlist.products.forEach((item) => {
          if (item.product) {
            flatData.push({
              _id: `${wishlist._id}-${item.product._id}`,
              wishlistId: wishlist._id,
              userId: wishlist.user._id,
              userName: wishlist.user.name,
              userEmail: wishlist.user.email,
              userPhone: wishlist.user.phone || "",
              productId: item.product._id,
              productName: item.product.name,
              productPrice: item.product.price,
              productDiscountPrice: item.product.discountPrice,
              productStock: item.product.stock ?? 0,
              productImage:
                (Array.isArray(item.product.images?.desktop)
                  ? item.product.images.desktop[0]
                  : null) ||
                (Array.isArray(item.product.images)
                  ? item.product.images[0]
                  : "") ||
                item.product.image ||
                "",
              addedAt: item.addedAt,
            });
          }
        });
      }
    });

    return res.status(200).json({
      message: "All wishlists fetched successfully",
      totalEntries: flatData.length,
      wishlists: flatData,
    });
  } catch (error) {
    console.error("Get All Wishlists Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. ADMIN ADD TO WISHLIST (Admin Side)
   Save product to a customer's wishlist on their behalf
========================================================= */
export const adminAddToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Please select a valid customer" });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Please select a valid product" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Customer account not found" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isActive === false) {
      return res.status(404).json({ message: "Product not found or currently inactive" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    const alreadyExists = wishlist.products.some(
      (item) => item.product.toString() === productId,
    );

    if (alreadyExists) {
      return res.status(400).json({
        message: `"${product.name}" is already in ${user.name}'s wishlist`,
      });
    }

    const addedAt = new Date();
    wishlist.products.unshift({ product: productId, addedAt });
    await wishlist.save();

    const flatEntry = {
      _id: `${wishlist._id}-${product._id}`,
      wishlistId: wishlist._id,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || "",
      productId: product._id,
      productName: product.name,
      productPrice: product.price,
      productDiscountPrice: product.discountPrice,
      productStock: product.stock ?? 0,
      productImage:
        (Array.isArray(product.images?.desktop)
          ? product.images.desktop[0]
          : null) ||
        (Array.isArray(product.images)
          ? product.images[0]
          : "") ||
        product.image ||
        "",
      addedAt,
    };

    return res.status(201).json({
      message: `"${product.name}" added to ${user.name}'s wishlist successfully`,
      entry: flatEntry,
    });
  } catch (error) {
    console.error("Admin Add to Wishlist Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. ADMIN REMOVE FROM WISHLIST (Admin Side)
========================================================= */
export const adminRemoveWishlistItem = async (req, res) => {
  try {
    const userId = req.body?.userId || req.params?.userId || req.query?.userId;
    const productId = req.body?.productId || req.params?.productId || req.query?.productId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found for this customer" });
    }

    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(
      (item) => item.product.toString() !== productId,
    );

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({ message: "Product was not found in customer's wishlist" });
    }

    await wishlist.save();

    return res.status(200).json({
      message: "Item removed from customer's wishlist successfully",
      userId,
      productId,
    });
  } catch (error) {
    console.error("Admin Remove Wishlist Item Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


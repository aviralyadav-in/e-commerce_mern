import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
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
      .populate("products.product", "name images price discountPrice")
      .sort({ updatedAt: -1 });

    // Flat structure banao taaki admin table me easily dikha sake
    const flatData = [];
    wishlists.forEach((wishlist) => {
      if (wishlist.user && wishlist.products.length > 0) {
        wishlist.products.forEach((item) => {
          if (item.product) {
            flatData.push({
              _id: `${wishlist._id}-${item.product._id}`,
              userName: wishlist.user.name,
              userEmail: wishlist.user.email,
              userPhone: wishlist.user.phone || "N/A",
              productName: item.product.name,
              productPrice: item.product.price,
              productDiscountPrice: item.product.discountPrice,
              productImage:
                item.product.images?.desktop?.[0] || "",
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

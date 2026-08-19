import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js"; // Product model ka path adjust kar lena
import mongoose from "mongoose";
import { z } from "zod";

// Zod validation incoming request (req.body) ke liye
// Client sirf product ID aur quantity bhejega, price backend decide karega
const objectIdValidation = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
const addToCartRequestSchema = z.object({
  product: objectIdValidation,
  quantity: z
    .number()
    .int()
    .min(1, "Quantity cannot be less than 1")
    .default(1),
});

/* =========================================================
   HELPER FUNCTION: Calculate Cart Totals
========================================================= */
const calculateCartTotals = (cart) => {
  // 1. Calculate base total price
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // 2. Calculate total after discount (Agar koi coupon applied hai)
  const afterDiscount = cart.totalPrice - (cart.discountAmount || 0);

  // Amount negative na ho jaye isliye Math.max(0, ...)
  cart.totalAmountAfterDiscount = Math.max(0, afterDiscount);
};

/* =========================================================
   1. ADD TO CART / UPDATE QUANTITY
========================================================= */
export const addToCart = async (req, res) => {
  try {
    const result = addToCartRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { product: productId, quantity } = result.data;
    const userId = req.user._id; // Auth middleware se aayega

    // 1. Check if product exists & fetch its REAL price
    const productExists = await Product.findById(productId);
    if (!productExists || !productExists.isActive) {
      return res.status(404).json({ message: "Product not found or inactive" });
    }

    // 2. Stock check kar sakte hain yahan (Optional but recommended)
    if (productExists.stock < quantity) {
      return res.status(400).json({ message: "Insufficient product stock" });
    }

    // 3. Find User's Cart
    let cart = await Cart.findOne({ user: userId });

    // Agar cart nahi hai, toh naya bana lo
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // 4. Check agar product already cart me hai
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      // Product pehle se hai -> sirf quantity update karein
      cart.items[itemIndex].quantity += quantity;

      // Price bhi update kar do, in case admin ne price change kar di ho
      cart.items[itemIndex].price = productExists.price;
    } else {
      // Naya product cart me push karein
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: productExists.price, // REAL price from DB
      });
    }

    // 5. Total Calculate karein aur Save karein
    calculateCartTotals(cart);
    await cart.save();

    // Populate karke return karein taaki frontend par details dikh sakein
    await cart.populate("items.product", "name images price");

    return res.status(200).json({
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET USER CART
========================================================= */
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId })
      .populate("items.product", "name images price stock")
      .populate("couponApplied", "code discount"); // Agar coupon banaya hai

    if (!cart) {
      // Agar naya user hai aur cart nahi bana, toh empty structure bhej do
      return res.status(200).json({
        message: "Cart is empty",
        cart: {
          items: [],
          totalPrice: 0,
          discountAmount: 0,
          totalAmountAfterDiscount: 0,
        },
      });
    }

    return res.status(200).json({
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. REMOVE ITEM FROM CART
========================================================= */
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Product ko array se filter out karein
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    // Filter karne ke baad totals wapas calculate karein
    calculateCartTotals(cart);
    await cart.save();

    await cart.populate("items.product", "name images price");

    return res.status(200).json({
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove From Cart Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. CLEAR ENTIRE CART (Order place hone ke baad use hoga)
========================================================= */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.couponApplied = null;
    cart.discountAmount = 0;
    calculateCartTotals(cart);

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. GET ALL CARTS (Admin Side) - Sabhi users ke carts
========================================================= */
export const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate("user", "name email phone")
      .populate("items.product", "name images price discountPrice")
      .sort({ updatedAt: -1 });

    // Flat structure banao taaki admin table me easily dikha sake
    const flatData = [];
    carts.forEach((cart) => {
      if (cart.user && cart.items.length > 0) {
        cart.items.forEach((item) => {
          if (item.product) {
            flatData.push({
              _id: `${cart._id}-${item.product._id}`,
              userName: cart.user.name,
              userEmail: cart.user.email,
              userPhone: cart.user.phone || "N/A",
              productName: item.product.name,
              productPrice: item.product.price,
              productDiscountPrice: item.product.discountPrice,
              productImage:
                item.product.images?.desktop?.[0] || "",
              quantity: item.quantity,
              itemTotal: item.price * item.quantity,
              addedAt: cart.updatedAt,
            });
          }
        });
      }
    });

    return res.status(200).json({
      message: "All carts fetched successfully",
      totalEntries: flatData.length,
      carts: flatData,
    });
  } catch (error) {
    console.error("Get All Carts Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

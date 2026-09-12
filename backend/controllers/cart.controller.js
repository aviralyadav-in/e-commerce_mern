import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js"; // Product model ka path adjust kar lena
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { z } from "zod";
// 🆕 Selling price + currency rounding helper
import { unitPrice, roundCurrency } from "../utils/commerce.js";

// Zod validation incoming request (req.body) ke liye
// Client sirf product ID aur quantity bhejega, price backend decide karega
const objectIdValidation = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
const addToCartRequestSchema = z.object({
  product: objectIdValidation,
  // 🆕 Variant snapshot — same product ke alag colors alag lines banate hain
  variantName: z
    .string({ error: "Variant name must be a string" })
    .trim()
    .max(60, "Variant name cannot exceed 60 characters")
    .nullable()
    .optional(),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity cannot be less than 1")
    .default(1),
});

// Absolute quantity set karne ke liye (PUT /cart/update/:productId)
const updateCartItemSchema = z.object({
  // 🆕 Kaunsi variant line update karni hai
  variantName: z
    .string({ error: "Variant name must be a string" })
    .trim()
    .max(60, "Variant name cannot exceed 60 characters")
    .nullable()
    .optional(),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be an integer")
    .min(1, "Quantity cannot be less than 1"),
});

/* =========================================================
   HELPER FUNCTION: Calculate Cart Totals
========================================================= */
const calculateCartTotals = (cart) => {
  // 1. Calculate base total price
  cart.totalPrice = roundCurrency(
    cart.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0),
  );

  // 2. Calculate total after discount (Agar koi coupon applied hai)
  const afterDiscount = cart.totalPrice - (cart.discountAmount || 0);

  // Amount negative na ho jaye isliye Math.max(0, ...)
  cart.totalAmountAfterDiscount = roundCurrency(Math.max(0, afterDiscount));
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

    const { product: productId, variantName, quantity } = result.data;
    const userId = req.user._id; // Auth middleware se aayega

    // 1. Check if product exists & fetch its REAL price
    const productExists = await Product.findById(productId);
    if (!productExists || !productExists.isActive) {
      return res.status(404).json({ message: "Product not found or inactive" });
    }

    // 1b. 🆕 Variant check — diya gaya variant product par exist karna chahiye
    if (variantName) {
      const hasVariant = (productExists.variants || []).some(
        (v) => v.name === variantName,
      );
      if (!hasVariant) {
        return res
          .status(400)
          .json({ message: "Selected variant is not available" });
      }
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

    // 4. 🆕 Product + variant combo already cart me hai?
    // (Black aur Brown ek hi product ke alag lines honge)
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.variantName || null) === (variantName || null),
    );

    if (itemIndex > -1) {
      // Line pehle se hai -> sirf quantity update karein
      cart.items[itemIndex].quantity += quantity;

      // Price bhi update kar do, in case admin ne price/sale change kar di ho
      cart.items[itemIndex].price = unitPrice(productExists);
    } else {
      // Nayi line cart me push karein
      cart.items.push({
        product: productId,
        variantName: variantName || null,
        quantity: quantity,
        price: unitPrice(productExists), // Selling price (sale included, warna MRP)
      });
    }

    // 5. Total Calculate karein aur Save karein
    calculateCartTotals(cart);
    await cart.save();

    // Populate karke return karein taaki frontend par details dikh sakein
    await cart.populate("items.product", "name images price discountPrice");

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

    let cart = await Cart.findOne({ user: userId });

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

    // 🆕 FIX (Sale price): Legacy carts me MRP snapshot pada ho sakta hai.
    // Har fetch par price ko DB ke current selling price (unitPrice) se
    // re-sync karte hain — purani cart lines bhi sale price par aa jaati hain.
    if (cart.items.length > 0) {
      const productIds = cart.items.map((item) => item.product);
      const products = await Product.find(
        { _id: { $in: productIds } },
        "price discountPrice",
      );
      const priceMap = new Map(
        products.map((p) => [String(p._id), unitPrice(p)]),
      );

      let changed = false;
      for (const item of cart.items) {
        const current = priceMap.get(String(item.product));
        if (current !== undefined && item.price !== current) {
          item.price = current;
          changed = true;
        }
      }
      if (changed) {
        calculateCartTotals(cart);
        await cart.save();
      }
    }

    // Populate ab karo (sync ke baad) taaki frontend ko details milein
    await cart.populate("items.product", "name images price discountPrice stock");
    await cart.populate("couponApplied", "code discountType discountValue"); // FIX: Coupon model ke real fields

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
   2b. UPDATE ITEM QUANTITY (Absolute set)
   Frontend quantity stepper ke liye — remove/add hack ki
   zaroorat nahi, seedha absolute quantity set hoti hai.
========================================================= */
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const result = updateCartItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { quantity, variantName } = result.data;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 🆕 Product + variant combo hi dhoondo (product ke multiple variant lines ho sakti hain)
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.variantName || null) === (variantName || null),
    );
    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in your cart" });
    }

    // Stock check — real product se
    const productExists = await Product.findById(productId);
    if (!productExists || !productExists.isActive) {
      return res.status(404).json({ message: "Product not found or inactive" });
    }
    if (productExists.stock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock! Only ${productExists.stock} left`,
      });
    }

    // Absolute quantity set karo aur price sync rakho (sale price included)
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = unitPrice(productExists);

    calculateCartTotals(cart);
    await cart.save();

    await cart.populate("items.product", "name images price discountPrice stock");

    return res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error);
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

    // 🆕 Optional variantName — diya toh sirf wahi variant line remove hogi,
    // nahi diya toh poore product ki saari lines (legacy behaviour)
    const variantName = req.query.variantName
      ? String(req.query.variantName)
      : null;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Product (+ variant match) ko array se filter out karein
    cart.items = cart.items.filter((item) => {
      if (item.product.toString() !== productId) return true;
      if (variantName === null) return false;
      return (item.variantName || null) !== variantName;
    });

    // Filter karne ke baad totals wapas calculate karein
    calculateCartTotals(cart);
    await cart.save();

    await cart.populate("items.product", "name images price discountPrice");

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
              _id: `${cart._id}-${item.product._id}-${item.variantName || "plain"}`,
              cartId: cart._id,
              userId: cart.user._id,
              userName: cart.user.name,
              userEmail: cart.user.email,
              userPhone: cart.user.phone || "",
              productId: item.product._id,
              productName: item.product.name,
              productStock: item.product.stock ?? 0,
              productVariant: item.variantName || null,
              productPrice: item.product.price,
              productDiscountPrice: item.product.discountPrice,
              productImage:
                (Array.isArray(item.product.images?.desktop)
                  ? item.product.images.desktop[0]
                  : null) ||
                (Array.isArray(item.product.images)
                  ? item.product.images[0]
                  : "") ||
                item.product.image ||
                "",
              quantity: item.quantity,
              itemTotal: (item.price || item.product.discountPrice || item.product.price || 0) * item.quantity,
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

/* =========================================================
   6. ADMIN ADD TO CART (Admin Side)
   Save/add item directly to a customer's cart
========================================================= */
export const adminAddToCart = async (req, res) => {
  try {
    const { userId, productId, variantName, quantity = 1 } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Please select a valid customer" });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Please select a valid product" });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Customer account not found" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isActive === false) {
      return res.status(404).json({ message: "Product not found or currently inactive" });
    }

    if (variantName) {
      const hasVariant = (product.variants || []).some(
        (v) => v.name === variantName,
      );
      if (!hasVariant) {
        return res
          .status(400)
          .json({ message: "Selected variant is not available" });
      }
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (item.variantName || null) === (variantName || null),
    );

    // Stock check me cart me pehle se padi quantity bhi gino — warna baar-baar
    // add karke line stock se zyada ho jaati
    const alreadyInCart = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
    if (product.stock < alreadyInCart + qty) {
      return res.status(400).json({
        message: `Insufficient stock for "${product.name}". Available stock: ${product.stock}${alreadyInCart ? `, already in cart: ${alreadyInCart}` : ""}`,
      });
    }

    const price = unitPrice(product);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += qty;
      cart.items[itemIndex].price = price;
    } else {
      cart.items.push({
        product: productId,
        variantName: variantName || null,
        quantity: qty,
        price,
      });
    }

    calculateCartTotals(cart);
    await cart.save();

    const currentQty = itemIndex > -1 ? cart.items[itemIndex].quantity : qty;

    const flatEntry = {
      _id: `${cart._id}-${product._id}-${variantName || "plain"}`,
      cartId: cart._id,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || "",
      productId: product._id,
      productName: product.name,
      productStock: product.stock ?? 0,
      productVariant: variantName || null,
      productPrice: product.price,
      productDiscountPrice: product.discountPrice,
      productImage:
        (Array.isArray(product.images?.desktop)
          ? product.images.desktop[0]
          : null) ||
        (Array.isArray(product.images)
          ? product.images[0]
          : "") ||
        product.image ||
        "",
      quantity: currentQty,
      itemTotal: price * currentQty,
      addedAt: cart.updatedAt,
    };

    return res.status(201).json({
      message: `"${product.name}" added to ${user.name}'s cart successfully`,
      entry: flatEntry,
      cart,
    });
  } catch (error) {
    console.error("Admin Add To Cart Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   7. ADMIN REMOVE FROM CART (Admin Side)
========================================================= */
export const adminRemoveFromCart = async (req, res) => {
  try {
    const userId = req.body?.userId || req.params?.userId || req.query?.userId;
    const productId = req.body?.productId || req.params?.productId || req.query?.productId;
    // Variant nahi diya (ya "plain") = sirf bina-variant wali line. Us product
    // ki baaki variant lines nahi hatni chahiye (admin table bhi yahi maanta hai)
    const rawVariant = req.body?.variantName ?? req.query?.variantName ?? null;
    const variantName =
      rawVariant && rawVariant !== "plain" ? String(rawVariant) : null;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this customer" });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId ||
        (item.variantName || null) !== variantName,
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item was not found in customer's cart" });
    }

    calculateCartTotals(cart);
    await cart.save();

    return res.status(200).json({
      message: "Item removed from customer's cart successfully",
      userId,
      productId,
      variantName,
    });
  } catch (error) {
    console.error("Admin Remove From Cart Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   8. ADMIN UPDATE CART QUANTITY (Admin Side)
========================================================= */
export const adminUpdateCartQuantity = async (req, res) => {
  try {
    const { userId, productId, variantName, quantity } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        message: `Insufficient stock for "${product.name}". Available stock: ${product.stock}`,
      });
    }

    const item = cart.items.find(
      (it) =>
        it.product.toString() === productId &&
        (it.variantName || null) === (variantName || null),
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = qty;
    item.price = unitPrice(product);
    calculateCartTotals(cart);
    await cart.save();

    return res.status(200).json({
      message: "Cart quantity updated successfully",
      userId,
      productId,
      variantName,
      quantity: qty,
      itemTotal: item.price * qty,
    });
  } catch (error) {
    console.error("Admin Update Cart Quantity Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


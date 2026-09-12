import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";
import { Coupon } from "../models/coupon.model.js";
import { Cart } from "../models/cart.model.js";
import { Settings } from "../models/settings.model.js";
import { z } from "zod";
// 🆕 Selling price + coupon refund + currency rounding helpers
import {
  unitPrice,
  decrementCouponUsage,
  roundCurrency,
} from "../utils/commerce.js";

// MongoDB ObjectId validator
const objectIdValidation = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

// Sirf wahi data jo User frontend se bhejega
const createOrderRequestSchema = z.object({
  shippingAddress: objectIdValidation,
  orderItems: z
    .array(
      z.object({
        product: objectIdValidation,
        // 🆕 Variant snapshot — order history me color dikhe
        variantName: z
          .string({ error: "Variant name must be a string" })
          .trim()
          .max(60, "Variant name cannot exceed 60 characters")
          .nullable()
          .optional(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "Order must contain at least one item"),
  paymentMethod: z.enum(["COD", "Card", "UPI"], {
    error: "Payment method must be COD, Card, or UPI",
  }),
  couponCode: z.string().optional(),
});

// Settings document na mile tab ke fallback. Rule (admin Settings page jaisa):
// discount ke baad cart value threshold se KAM ho tabhi shipping fee — barabar
// ya zyada par free shipping.
const FREE_SHIP_THRESHOLD = 500;
const SHIPPING_FEE = 50;

/* =========================================================
   1. CREATE NEW ORDER (User Route)
========================================================= */
export const createOrder = async (req, res) => {
  try {
    const result = createOrderRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: result.error.issues[0].message,
      });
    }

    const { shippingAddress, orderItems, paymentMethod, couponCode } =
      result.data;
    const userId = req.user._id;

    // 1. Verify Shipping Address (naya schema: 'user' field par ownership check)
    const address = await Address.findOne({
      _id: shippingAddress,
      user: userId,
    });
    if (!address) {
      return res.status(404).json({
        message: "Shipping address not found or does not belong to you",
      });
    }

    // 2. Fetch Real Prices & Check Stock
    let itemsPrice = 0;
    const finalOrderItems = [];
    // 🆕 Atomic deduction ke liye product ka naam bhi yaad rakho (error msg)
    const stockReserve = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product || !product.isActive) {
        return res
          .status(404)
          .json({ message: `Product not found or inactive: ${item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Out of stock! Only ${product.stock} left for ${product.name}`,
        });
      }

      // 🆕 Variant validation — product par ye variant exist karna chahiye
      if (item.variantName) {
        const hasVariant = (product.variants || []).some(
          (v) => v.name === item.variantName,
        );
        if (!hasVariant) {
          return res.status(400).json({
            message: `Selected variant is not available for ${product.name}`,
          });
        }
      }

      // 🆕 FIX (Sale price): backend se real SELLING price set karna
      // (sale valid ho toh discountPrice, warna MRP) — customer ko MRP nahi
      const unit = unitPrice(product);
      itemsPrice += unit * item.quantity;

      finalOrderItems.push({
        product: product._id,
        variantName: item.variantName || null,
        quantity: item.quantity,
        price: unit, // Selling price snapshot (sale included)
      });

      stockReserve.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
      });
    }

    // 3. Coupon Validation & Real Discount Calculation
    let discountAmount = 0;
    let appliedCouponCode = null;
    let appliedCoupon = null;

    if (couponCode) {
      const normalizedCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalizedCode });

      if (!coupon || !coupon.isActive) {
        return res
          .status(400)
          .json({ message: "Invalid or inactive coupon code" });
      }

      if (new Date() > new Date(coupon.expiryDate)) {
        return res.status(400).json({ message: "This coupon has expired" });
      }

      if (itemsPrice < coupon.minOrderValue) {
        return res.status(400).json({
          message: `Minimum order value must be ₹${coupon.minOrderValue} to use this coupon`,
        });
      }

      // Usage limit — total redemptions check karo
      if (
        coupon.usageLimit != null &&
        (coupon.usedCount || 0) >= coupon.usageLimit
      ) {
        return res
          .status(400)
          .json({ message: "This coupon has reached its usage limit" });
      }

      // Per-user limit — coupon.usedBy me is user ka count
      if (coupon.perUserLimit != null) {
        const entry = (coupon.usedBy || []).find(
          (u) => String(u.user) === String(userId),
        );
        if (entry && (entry.count || 0) >= coupon.perUserLimit) {
          return res.status(400).json({
            message:
              "You have already used this coupon the maximum number of times",
          });
        }
      }

      if (coupon.discountType === "percentage") {
        discountAmount = roundCurrency((itemsPrice * coupon.discountValue) / 100);
      } else if (coupon.discountType === "flat") {
        discountAmount = roundCurrency(coupon.discountValue);
      }

      // Discount kabhi items ke total se zyada nahi ho sakta
      discountAmount = Math.min(discountAmount, itemsPrice);
      appliedCouponCode = coupon.code;
      appliedCoupon = coupon;
    }

    // 4. Shipping & Payment Rules — Dynamic settings
    const storeSettings = await Settings.getSingleton();

    if (paymentMethod === "COD" && storeSettings?.codEnabled === false) {
      return res.status(400).json({
        message:
          "Cash on Delivery (COD) is currently disabled by store management. Please select UPI or Card payment.",
      });
    }

    const freeThreshold = storeSettings?.freeShippingThreshold ?? FREE_SHIP_THRESHOLD;
    const dynamicShippingFee = storeSettings?.shippingFee ?? SHIPPING_FEE;
    const codConvenienceFee =
      paymentMethod === "COD" && (storeSettings?.codFee || 0) > 0
        ? Number(storeSettings.codFee)
        : 0;

    itemsPrice = roundCurrency(itemsPrice);
    discountAmount = roundCurrency(discountAmount);

    const afterDiscount = Math.max(0, itemsPrice - discountAmount);
    const shippingPrice =
      itemsPrice > 0 && afterDiscount < freeThreshold
        ? dynamicShippingFee
        : 0;

    const totalAmount = roundCurrency(
      Math.max(0, afterDiscount + shippingPrice + codConvenienceFee),
    );

    // 5. 🆕 FIX (Oversell race condition): Atomic stock decrement —
    // order banane se PEHLE. Pehle "check + alag se $inc" hota tha, do
    // parallel requests dono check pass karke stock negative kar sakte the.
    // Ab conditional update me hi stock reserve hota hai — guaranteed atomic.
    const deducted = [];
    for (const item of stockReserve) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after" },
      );

      if (!updated) {
        // Ye item out of stock hai — is order ke pehle deduct hue stock wapas
        for (const done of deducted) {
          await Product.findByIdAndUpdate(done.product, {
            $inc: { stock: done.quantity },
          });
        }
        return res.status(400).json({
          message: `Out of stock! Requested quantity of ${item.name} is no longer available`,
        });
      }

      deducted.push({ product: item.product, quantity: item.quantity });
    }

    // 6. Create Order — agar creation fail ho toh deducted stock rollback
    let order;
    try {
      order = await Order.create({
        user: userId,
        shippingAddress,
        orderItems: finalOrderItems,
        itemsPrice,
        shippingPrice,
        codFee: codConvenienceFee,
        couponCode: appliedCouponCode,
        discountAmount,
        totalAmount,
        paymentMethod,
        // No payment gateway hai — Card/UPI bhi Pending rahenge jab tak admin
        // payment manually confirm na kare (paymentStatus = Completed).
        // Fake "Completed" revenue se bachne ke liye.
        paymentStatus: "Pending",
      });
    } catch (createError) {
      for (const done of deducted) {
        await Product.findByIdAndUpdate(done.product, {
          $inc: { stock: done.quantity },
        });
      }
      throw createError;
    }

    // 6b. Coupon usage record karo — usedCount + per-user count badhao
    if (appliedCoupon) {
      const bumped = await Coupon.findOneAndUpdate(
        { _id: appliedCoupon._id, "usedBy.user": userId },
        { $inc: { usedCount: 1, "usedBy.$.count": 1 } },
      );
      if (!bumped) {
        await Coupon.findByIdAndUpdate(appliedCoupon._id, {
          $inc: { usedCount: 1 },
          $push: { usedBy: { user: userId, count: 1 } },
        });
      }
    }

    // 7. Order place hone ke baad user ka Cart server-side clear karo
    await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          totalPrice: 0,
          couponApplied: null,
          discountAmount: 0,
          totalAmountAfterDiscount: 0,
        },
      },
    );

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   2. GET LOGGED IN USER'S ORDERS (User Route)
========================================================= */
export const myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("orderItems.product", "name images price") // Product details
      .populate(
        "shippingAddress",
        "firstName lastName phone addressLine1 addressLine2 landmark city state zipCode",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Orders fetched successfully",
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   3. GET SINGLE ORDER DETAILS (User/Admin Route)
========================================================= */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛠️ Invalid ObjectId → 400 (mongoose cast 500 nahi)
    if (!objectIdValidation.safeParse(id).success) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product", "name images price")
      .populate("shippingAddress");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security Check: Sirf order ka owner ya Admin isko dekh sakta hai
    // FIX: User model mein role field nahi hai, admin middleware req.admin set karta hai
    // FIX: Agar order ka user delete ho chuka hai toh populate null return karega — crash se bachao
    const ownerId = order.user?._id
      ? order.user._id.toString()
      : String(order.user);
    const isOwner = req.user && ownerId === req.user._id.toString();
    const isAdmin = req.admin?.role === "SuperAdmin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    return res.status(200).json({
      message: "Order details fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   4. GET ALL ORDERS (Admin Route)
========================================================= */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate(
        "shippingAddress",
        "firstName lastName fullName phone addressLine1 city state zipCode",
      )
      .populate("orderItems.product", "name images price")
      .sort({ createdAt: -1 });

    // Admin dashboard ke liye total sales ka calculate karna
    let totalSales = 0;
    orders.forEach((order) => {
      // Revenue = sirf CONFIRMED payments. Pending COD/Card/UPI paisa
      // nahi hai, aur Cancelled orders bhi revenue nahi hote.
      if (
        order.paymentStatus === "Completed" &&
        order.orderStatus !== "Cancelled"
      ) {
        totalSales += order.totalAmount;
      }
    });

    return res.status(200).json({
      message: "All orders fetched successfully",
      count: orders.length,
      totalSales,
      orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   5. UPDATE ORDER STATUS (Admin Route)
========================================================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛠️ Invalid ObjectId → 400
    if (!objectIdValidation.safeParse(id).success) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const { orderStatus, paymentStatus, transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🛠️ Invalid status values → 400 + clear message (schema enum fail hone
    // par pehle 500 jaata tha)
    const VALID_ORDER_STATUSES = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    const VALID_PAYMENT_STATUSES = [
      "Pending",
      "Completed",
      "Failed",
      "Refunded",
    ];

    if (orderStatus && !VALID_ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        message: `Order status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
      });
    }
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        message: `Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
      });
    }

    if (
      orderStatus &&
      orderStatus !== "Delivered" &&
      order.orderStatus === "Delivered"
    ) {
      return res
        .status(400)
        .json({ message: "You have already delivered this order" });
    }

    if (
      orderStatus &&
      orderStatus !== "Cancelled" &&
      order.orderStatus === "Cancelled"
    ) {
      return res
        .status(400)
        .json({ message: "Cannot change status of a cancelled order" });
    }

    // FIX: Pehle ka status yaad rakho (cancel par sirf EK baar stock restore ho)
    const previousStatus = order.orderStatus;

    // Update Statuses
    if (orderStatus) {
      order.orderStatus = orderStatus;
      // Agar deliver ho gaya toh time note kar lo (existing time preserve karo)
      if (orderStatus === "Delivered") {
        if (!order.deliveredAt) order.deliveredAt = Date.now();
        order.paymentStatus = "Completed"; // COD orders ke liye
      }
    }

    // FIX: Cancel hone par products ka stock wapas restore karo
    // (sirf tab jab pehle se cancelled na ho — double restore se bachne ke liye)
    if (orderStatus === "Cancelled" && previousStatus !== "Cancelled") {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      // 🆕 FIX (Coupon refund): Cancel hone par coupon ka usage count bhi
      // wapas karo — warna limit hit ho jaati hai aur 11th user block ho jaata.
      if (order.couponCode) {
        // Global usedCount ghatao (guard: 0 se neeche nahi jayega)
        await decrementCouponUsage(order.couponCode);

        // Per-user count ghatao (guard: entry ho aur count > 0)
        await Coupon.updateOne(
          {
            code: order.couponCode,
            "usedBy.user": order.user,
            "usedBy.count": { $gt: 0 },
          },
          { $inc: { "usedBy.$.count": -1 } },
        );
      }
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (transactionId) order.transactionId = transactionId;

    await order.save();

    // 🛠️ Return fully populated order so Redux doesn't overwrite populated
    // customer/address/product fields with raw ObjectIds
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("shippingAddress")
      .populate("orderItems.product", "name images price");

    return res.status(200).json({
      message: "Order status updated successfully",
      order: populatedOrder || order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================================================
   NOTE: Order hard-DELETE route hata di gayi hai.
   Real admins order ko CANCEL karte hain (updateOrderStatus se
   orderStatus = Cancelled — stock restore + refund trail bhi).
   Hard delete se order history/reports corrupt ho jaate the.
========================================================= */

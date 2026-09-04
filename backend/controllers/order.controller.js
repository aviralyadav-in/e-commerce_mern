import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";
import { Coupon } from "../models/coupon.model.js";
import { Cart } from "../models/cart.model.js";
import { z } from "zod";

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

// Storefront (utils/shipping.js + OrderBreakdown) ke saath identical shipping rules
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

      // Backend se real price set karna
      const itemTotalPrice = product.price * item.quantity;
      itemsPrice += itemTotalPrice;

      finalOrderItems.push({
        product: product._id,
        variantName: item.variantName || null,
        quantity: item.quantity,
        price: product.price, // Real DB Price
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
        discountAmount = (itemsPrice * coupon.discountValue) / 100;
      } else if (coupon.discountType === "flat") {
        discountAmount = coupon.discountValue;
      }

      // Discount kabhi items ke total se zyada nahi ho sakta
      discountAmount = Math.min(discountAmount, itemsPrice);
      appliedCouponCode = coupon.code;
      appliedCoupon = coupon;
    }

    // 4. Shipping — storefront CartSummary jaisa hi (discounted amount par based)
    const afterDiscount = Math.max(0, itemsPrice - discountAmount);
    const shippingPrice =
      itemsPrice > 0 && afterDiscount <= FREE_SHIP_THRESHOLD
        ? SHIPPING_FEE
        : 0;

    const totalAmount = Math.max(0, afterDiscount + shippingPrice);

    // 5. Create Order
    const order = await Order.create({
      user: userId,
      shippingAddress,
      orderItems: finalOrderItems,
      itemsPrice,
      shippingPrice,
      couponCode: appliedCouponCode,
      discountAmount,
      totalAmount,
      paymentMethod,
      // No payment gateway hai — Card/UPI bhi Pending rahenge jab tak admin
      // payment manually confirm na kare (paymentStatus = Completed).
      // Fake "Completed" revenue se bachne ke liye.
      paymentStatus: "Pending",
    });

    // 6. Deduct Stock from Products
    for (const item of finalOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
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
      .populate("shippingAddress", "city state")
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
    const { orderStatus, paymentStatus, transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === "Delivered") {
      return res
        .status(400)
        .json({ message: "You have already delivered this order" });
    }

    // FIX: Pehle ka status yaad rakho (cancel par sirf EK baar stock restore ho)
    const previousStatus = order.orderStatus;

    // Update Statuses
    if (orderStatus) {
      order.orderStatus = orderStatus;
      // Agar deliver ho gaya toh time note kar lo
      if (orderStatus === "Delivered") {
        order.deliveredAt = Date.now();
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
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (transactionId) order.transactionId = transactionId;

    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
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

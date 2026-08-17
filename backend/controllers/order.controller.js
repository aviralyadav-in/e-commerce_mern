import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";
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
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "Order must contain at least one item"),
  paymentMethod: z.enum(["COD", "Card", "UPI"], {
    errorMap: () => ({ message: "Payment method must be COD, Card, or UPI" }),
  }),
  couponCode: z.string().optional(),
});

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

    // 1. Verify Shipping Address
    const address = await Address.findOne({
      _id: shippingAddress,
      customer: userId,
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

      // Backend se real price set karna
      const itemTotalPrice = product.price * item.quantity;
      itemsPrice += itemTotalPrice;

      finalOrderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price, // Real DB Price
      });
    }

    // 3. Calculate Shipping & Discounts
    // Example logic: Free shipping on orders above 500, else 50
    const shippingPrice = itemsPrice > 500 ? 0 : 50;

    // Yahan aap apne Coupon model se real discount calculate kar sakte hain
    let discountAmount = 0;

    const totalAmount = itemsPrice + shippingPrice - discountAmount;

    // 4. Create Order
    const order = await Order.create({
      user: userId,
      shippingAddress,
      orderItems: finalOrderItems,
      itemsPrice,
      shippingPrice,
      couponCode: couponCode || null,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Completed", // Placeholder logic
    });

    // 5. Deduct Stock from Products
    for (const item of finalOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // OPTIONAL: Yahan aap user ka Cart clear kar sakte hain
    // await Cart.findOneAndUpdate({ user: userId }, { items: [], totalPrice: 0 });

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
      .populate("shippingAddress", "full_name street city state pincode")
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
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "SuperAdmin"
    ) {
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
      if (
        order.paymentStatus === "Completed" ||
        order.orderStatus === "Delivered"
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

    // Update Statuses
    if (orderStatus) {
      order.orderStatus = orderStatus;
      // Agar deliver ho gaya toh time note kar lo
      if (orderStatus === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentStatus = "Completed"; // COD orders ke liye
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

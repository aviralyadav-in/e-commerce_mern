import { Coupon } from "../models/coupon.model.js";
import { Order } from "../models/order.model.js";

/** Storefront selling price: valid sale price wins, otherwise MRP. */
export const unitPrice = (product) => {
  const mrp = Number(product.price) || 0;
  const sale = Number(product.discountPrice);
  if (Number.isFinite(sale) && sale > 0 && sale < mrp) return sale;
  return mrp;
};

export const calcCouponDiscount = (coupon, itemsPrice) => {
  if (!coupon || itemsPrice <= 0) return 0;
  const amount =
    coupon.discountType === "percentage"
      ? (itemsPrice * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);
  return Math.min(Math.max(0, amount), itemsPrice);
};

/**
 * Shared coupon rules for apply + checkout.
 * usageLimit / perUserLimit null or 0 = unlimited.
 */
export const assertCouponUsable = async (coupon, { itemsPrice, userId }) => {
  if (!coupon || !coupon.isActive) {
    return { error: "Invalid or inactive coupon code" };
  }

  if (new Date() > new Date(coupon.expiryDate)) {
    return { error: "This coupon has expired" };
  }

  if (itemsPrice < (coupon.minOrderValue || 0)) {
    return {
      error: `Minimum order value must be ₹${coupon.minOrderValue} to use this coupon`,
    };
  }

  const usageLimit = Number(coupon.usageLimit) || 0;
  if (usageLimit > 0 && Number(coupon.usedCount || 0) >= usageLimit) {
    return { error: "This coupon has reached its usage limit" };
  }

  const perUserLimit = Number(coupon.perUserLimit) || 0;
  if (perUserLimit > 0 && userId) {
    const usedByUser = await Order.countDocuments({
      user: userId,
      couponCode: coupon.code,
      orderStatus: { $ne: "Cancelled" },
    });
    if (usedByUser >= perUserLimit) {
      return {
        error: "You have already used this coupon the maximum number of times",
      };
    }
  }

  return { ok: true };
};

export const incrementCouponUsage = async (code) => {
  if (!code) return;
  await Coupon.updateOne({ code }, { $inc: { usedCount: 1 } });
};

export const decrementCouponUsage = async (code) => {
  if (!code) return;
  await Coupon.updateOne(
    { code, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};

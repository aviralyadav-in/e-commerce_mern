import { Coupon } from "../models/coupon.model.js";

/** Storefront selling price: valid sale price wins, otherwise MRP. */
export const unitPrice = (product) => {
  const mrp = Number(product.price) || 0;
  const sale = Number(product.discountPrice);
  if (Number.isFinite(sale) && sale > 0 && sale < mrp) return sale;
  return mrp;
};

/** Rounds monetary value to 2 decimal places safely avoiding IEEE 754 float glitches */
export const roundCurrency = (val) =>
  Math.round((Number(val) + Number.EPSILON) * 100) / 100;

export const decrementCouponUsage = async (code) => {
  if (!code) return;
  await Coupon.updateOne(
    { code, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};

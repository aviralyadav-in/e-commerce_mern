/**
 * Pure coupon-status helpers shared by the coupon table, filters and pages.
 */

export const isExpired = (date) => !!date && new Date(date) < new Date();

export const isExhausted = (coupon) =>
  coupon?.usageLimit != null && (coupon?.usedCount || 0) >= coupon?.usageLimit;

/** A coupon is only usable when switched on, in date, and under its usage limit. */
export const couponState = (coupon) => {
  if (isExpired(coupon?.expiryDate)) return "expired";
  if (isExhausted(coupon)) return "exhausted";
  return coupon?.isActive ? "active" : "paused";
};
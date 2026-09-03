/**
 * Pure coupon-status helpers shared by the coupon table, filters and pages.
 */

export const isExpired = (date) => !!date && new Date(date) < new Date();

/** A coupon is only usable when it is switched on AND still in date. */
export const couponState = (coupon) => {
  if (isExpired(coupon.expiryDate)) return "expired";
  return coupon.isActive ? "active" : "paused";
};
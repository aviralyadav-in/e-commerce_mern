/**
 * Shipping rules — backend (order.controller.js) ke saath EXACTLY synced.
 * Dono jagah same values rakhen warna UI aur order total alag dikhega.
 */
export const FREE_SHIP_THRESHOLD = 500;
export const SHIPPING_FEE = 50;

/** Cart/Checkout summary panels jaisa hi shipping calculation — discounted amount par based. */
export const calcShipping = (subtotal, discount = 0) => {
  const afterDiscount = Math.max(0, subtotal - discount);
  return subtotal > 0 && afterDiscount <= FREE_SHIP_THRESHOLD
    ? SHIPPING_FEE
    : 0;
};
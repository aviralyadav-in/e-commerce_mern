import { create } from "zustand";
import { api } from "../lib/api";

const GUEST_CART_KEY = "niya_guest_cart";

const getSavedGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : { items: [], totalPrice: 0 };
  } catch {
    return { items: [], totalPrice: 0 };
  }
};

const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {
    // Ignore storage errors
  }
};

const calculateTotals = (items) => {
  return items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
};

export const useCartStore = create((set, get) => ({
  cart: {
    items: [],
    totalPrice: 0,
    discountAmount: 0,
    totalAmountAfterDiscount: 0,
    couponApplied: null,
  },
  isCartOpen: false,
  loading: false,
  couponLoading: false,
  appliedCoupon: null,
  discountAmount: 0,
  error: null,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  // Fetch cart (backend first, fallback to guest)
  getCart: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/cart");
      if (res.data?.cart) {
        const cartData = res.data.cart;
        set({
          cart: cartData,
          appliedCoupon: cartData.couponApplied || get().appliedCoupon,
          discountAmount: cartData.discountAmount || get().discountAmount,
          loading: false,
        });
        return cartData;
      }
    } catch {
      // Guest fallback
      const guest = getSavedGuestCart();
      const totalPrice = calculateTotals(guest.items || []);
      const fallbackCart = {
        items: guest.items || [],
        totalPrice,
        discountAmount: get().discountAmount,
        totalAmountAfterDiscount: Math.max(0, totalPrice - get().discountAmount),
        couponApplied: get().appliedCoupon,
      };
      set({ cart: fallbackCart, loading: false });
      return fallbackCart;
    }
  },

  // Add to cart
  addToCart: async ({ product, variantName = null, quantity = 1 }) => {
    try {
      set({ loading: true, error: null });
      const productId = product._id || product.id || product;
      const res = await api.post("/cart/add", {
        product: productId,
        variantName: variantName || null,
        quantity,
      });

      if (res.data?.cart) {
        set({ cart: res.data.cart, isCartOpen: true, loading: false });
        return { success: true, cart: res.data.cart };
      }
    } catch {
      // Guest cart support
      const currentItems = [...(get().cart.items || [])];
      const prodObj = typeof product === "object" ? product : { _id: product };
      const sellingPrice =
        prodObj.discountPrice && prodObj.discountPrice > 0 && prodObj.discountPrice < prodObj.price
          ? prodObj.discountPrice
          : prodObj.price || 0;

      const existingIndex = currentItems.findIndex(
        (it) =>
          String(it.product?._id || it.product) === String(prodObj._id) &&
          (it.variantName || null) === (variantName || null)
      );

      if (existingIndex > -1) {
        currentItems[existingIndex].quantity += quantity;
      } else {
        currentItems.push({
          product: prodObj,
          variantName: variantName || null,
          quantity,
          price: sellingPrice,
        });
      }

      const totalPrice = calculateTotals(currentItems);
      const discount = get().discountAmount || 0;
      const updatedCart = {
        items: currentItems,
        totalPrice,
        discountAmount: discount,
        totalAmountAfterDiscount: Math.max(0, totalPrice - discount),
        couponApplied: get().appliedCoupon,
      };

      saveGuestCart(updatedCart);
      set({ cart: updatedCart, isCartOpen: true, loading: false });
      return { success: true, cart: updatedCart };
    }
  },

  // Update item quantity (absolute)
  updateQuantity: async (productId, quantity, variantName = null) => {
    if (quantity < 1) {
      return get().removeFromCart(productId, variantName);
    }
    try {
      set({ loading: true });
      const res = await api.put(`/cart/update/${productId}`, {
        quantity,
        variantName: variantName || null,
      });
      if (res.data?.cart) {
        set({ cart: res.data.cart, loading: false });
        return { success: true };
      }
    } catch {
      const currentItems = (get().cart.items || []).map((it) => {
        const idMatch = String(it.product?._id || it.product) === String(productId);
        const varMatch = (it.variantName || null) === (variantName || null);
        if (idMatch && varMatch) {
          return { ...it, quantity };
        }
        return it;
      });
      const totalPrice = calculateTotals(currentItems);
      const discount = get().discountAmount || 0;
      const updated = {
        ...get().cart,
        items: currentItems,
        totalPrice,
        discountAmount: discount,
        totalAmountAfterDiscount: Math.max(0, totalPrice - discount),
      };
      saveGuestCart(updated);
      set({ cart: updated, loading: false });
      return { success: true };
    }
  },

  // Remove item from cart
  removeFromCart: async (productId, variantName = null) => {
    try {
      set({ loading: true });
      const qs = variantName ? `?variantName=${encodeURIComponent(variantName)}` : "";
      const res = await api.delete(`/cart/remove/${productId}${qs}`);
      if (res.data?.cart) {
        set({ cart: res.data.cart, loading: false });
        return { success: true };
      }
    } catch {
      const currentItems = (get().cart.items || []).filter((it) => {
        const idMatch = String(it.product?._id || it.product) === String(productId);
        const varMatch = (it.variantName || null) === (variantName || null);
        if (idMatch && (variantName === null || varMatch)) return false;
        return true;
      });
      const totalPrice = calculateTotals(currentItems);
      const discount = get().discountAmount || 0;
      const updated = {
        ...get().cart,
        items: currentItems,
        totalPrice,
        discountAmount: discount,
        totalAmountAfterDiscount: Math.max(0, totalPrice - discount),
      };
      saveGuestCart(updated);
      set({ cart: updated, loading: false });
      return { success: true };
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      await api.delete("/cart/clear");
    } catch {
      // Ignored
    }
    const emptyCart = {
      items: [],
      totalPrice: 0,
      discountAmount: 0,
      totalAmountAfterDiscount: 0,
      couponApplied: null,
    };
    saveGuestCart(emptyCart);
    set({ cart: emptyCart, appliedCoupon: null, discountAmount: 0 });
  },

  // Apply Coupon
  applyCoupon: async (code) => {
    try {
      set({ couponLoading: true });
      const orderTotal = get().cart.totalPrice || 0;
      const res = await api.post("/coupons/apply", {
        code: String(code).trim().toUpperCase(),
        orderTotal,
      });

      if (res.data) {
        const { coupon, discountAmount, finalAmount } = res.data;
        set({
          appliedCoupon: coupon,
          discountAmount: discountAmount || 0,
          cart: {
            ...get().cart,
            discountAmount: discountAmount || 0,
            totalAmountAfterDiscount: finalAmount,
            couponApplied: coupon,
          },
          couponLoading: false,
        });
        return { success: true, message: res.data.message || "Coupon applied!" };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid or ineligible coupon";
      set({ couponLoading: false });
      return { success: false, message: msg };
    }
  },

  // Remove Coupon
  removeCoupon: () => {
    const totalPrice = get().cart.totalPrice || 0;
    set({
      appliedCoupon: null,
      discountAmount: 0,
      cart: {
        ...get().cart,
        discountAmount: 0,
        totalAmountAfterDiscount: totalPrice,
        couponApplied: null,
      },
    });
  },

  // Total item quantity count
  getItemCount: () => {
    return (get().cart.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  },
}));

import { create } from "zustand";
import { api } from "../lib/api";

const GUEST_WISHLIST_KEY = "niya_guest_wishlist";

const getSavedGuestWishlist = () => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items) => {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
};

export const useWishlistStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,

  // Fetch wishlist
  getWishlist: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/wishlist");
      const list = (res.data?.wishlist?.products || []).map((entry) => entry.product).filter(Boolean);
      set({ products: list, loading: false });
      return list;
    } catch {
      const guest = getSavedGuestWishlist();
      set({ products: guest, loading: false });
      return guest;
    }
  },

  // Toggle wishlist product
  toggleWishlist: async (product) => {
    const productId = typeof product === "string" ? product : product._id || product.id;
    const isSaved = get().isInWishlist(productId);

    // Optimistic UI update
    let updatedProducts = [];
    if (isSaved) {
      updatedProducts = get().products.filter((p) => String(p._id || p.id || p) !== String(productId));
    } else {
      const productToAdd = typeof product === "object" ? product : { _id: productId };
      updatedProducts = [productToAdd, ...get().products];
    }
    set({ products: updatedProducts });

    try {
      const res = await api.post("/wishlist/toggle", { productId });
      if (res.data?.wishlist) {
        const serverList = (res.data.wishlist.products || [])
          .map((entry) => entry.product)
          .filter(Boolean);
        set({ products: serverList });
        return { success: true, action: res.data.action };
      }
    } catch {
      // Guest local fallback
      saveGuestWishlist(updatedProducts);
      return { success: true, action: isSaved ? "removed" : "added" };
    }
  },

  isInWishlist: (productId) => {
    if (!productId) return false;
    return get().products.some((p) => String(p._id || p.id || p) === String(productId));
  },

  getCount: () => {
    return get().products.length;
  },
}));

import { create } from "zustand";
import { api } from "../lib/api";

export const useSettingsStore = create((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/settings");
      const fetchedSettings = res.data?.settings || null;
      set({ settings: fetchedSettings, loading: false });
      return fetchedSettings;
    } catch (err) {
      console.error("Failed to fetch store settings:", err);
      set({ loading: false, error: err.message });
      return null;
    }
  },

  // Helper getters with sensible fallbacks
  getFreeShippingThreshold: () => {
    const s = get().settings;
    return typeof s?.freeShippingThreshold === "number" ? s.freeShippingThreshold : 500;
  },

  getShippingFee: () => {
    const s = get().settings;
    return typeof s?.shippingFee === "number" ? s.shippingFee : 50;
  },

  isCodEnabled: () => {
    const s = get().settings;
    return s?.codEnabled !== undefined ? Boolean(s.codEnabled) : true;
  },

  getCodFee: () => {
    const s = get().settings;
    return typeof s?.codFee === "number" ? s.codFee : 0;
  },
}));

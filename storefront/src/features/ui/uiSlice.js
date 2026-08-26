import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  const saved = localStorage.getItem("niya-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark"; // Niya Bags ka default dark theme
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("niya-theme", theme);
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: getInitialTheme(),
    searchOpen: false,
    cartOpen: false,
    mobileMenuOpen: false,
    toasts: [], // { id, message, type }
  },
  reducers: {
    initTheme: (state) => {
      applyTheme(state.theme);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(state.theme);
    },
    openSearch: (state) => {
      state.searchOpen = true;
    },
    closeSearch: (state) => {
      state.searchOpen = false;
    },
    openCart: (state) => {
      state.cartOpen = true;
    },
    closeCart: (state) => {
      state.cartOpen = false;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },
    pushToast: {
      reducer: (state, action) => {
        state.toasts.push(action.payload);
      },
      prepare: (message, type = "success") => ({
        payload: {
          id: Date.now() + Math.random().toString(16).slice(2),
          message,
          type,
        },
      }),
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  initTheme,
  toggleTheme,
  openSearch,
  closeSearch,
  openCart,
  closeCart,
  toggleMobileMenu,
  closeMobileMenu,
  pushToast,
  dismissToast,
} = uiSlice.actions;

export default uiSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

/**
 * Cross-cutting UI state: toast notifications and the command palette.
 */
const uiSlice = createSlice({
  name: "ui",
  initialState: {
    toasts: [],
    seq: 0,
    paletteOpen: false,
  },
  reducers: {
    pushToast: (state, action) => {
      const {
        type = "success",
        title,
        message = "",
        duration = 3500,
      } = action.payload || {};
      state.seq += 1;
      state.toasts.push({ id: state.seq, type, title, message, duration });
      // Never stack more than four — older ones fall off the top.
      if (state.toasts.length > 4) state.toasts.splice(0, state.toasts.length - 4);
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setPaletteOpen: (state, action) => {
      state.paletteOpen = !!action.payload;
    },
  },
});

export const { pushToast, dismissToast, clearToasts, setPaletteOpen } =
  uiSlice.actions;

/* Convenience creators */
export const toastSuccess = (title, message) =>
  pushToast({ type: "success", title, message });
export const toastError = (title, message) =>
  pushToast({ type: "error", title, message, duration: 5000 });
export const toastInfo = (title, message) =>
  pushToast({ type: "info", title, message });

export default uiSlice.reducer;

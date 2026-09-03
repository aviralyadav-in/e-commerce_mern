import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      if (saved === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return saved;
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
      return "dark";
    }
  }
  return "light";
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    paletteOpen: false,
    theme: getInitialTheme(),
  },
  reducers: {
    setPaletteOpen: (state, action) => {
      state.paletteOpen = !!action.payload;
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      state.theme = nextTheme;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", nextTheme);
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    setTheme: (state, action) => {
      const nextTheme = action.payload === "dark" ? "dark" : "light";
      state.theme = nextTheme;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", nextTheme);
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
  },
});

export const { setPaletteOpen, toggleTheme, setTheme } = uiSlice.actions;

export default uiSlice.reducer;

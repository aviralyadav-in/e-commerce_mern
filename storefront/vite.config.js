import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Port 5174 → backend CORS me allowed hai (5173 admin panel ke liye reserved)
  server: {
    port: 5174,
  },
});

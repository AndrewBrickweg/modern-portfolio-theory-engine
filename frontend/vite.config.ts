import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/login": { target: "http://localhost:8000", changeOrigin: true },
      "/register": { target: "http://localhost:8000", changeOrigin: true },
      "/portfolio": { target: "http://localhost:8000", changeOrigin: true },
      "/tickers": { target: "http://localhost:8000", changeOrigin: true },
      "/logout": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: process.env.APP_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"] },
    server: {
    port: 5182,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: { target: "es2022", sourcemap: false, chunkSizeWarningLimit: 700 },
});
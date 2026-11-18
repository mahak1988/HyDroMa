import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

/** MapLibre resolves its worker at runtime; publish it as a static asset (same approach as the POC). */
function maplibreWorkerAsset() {
  return {
    name: "maplibre-worker-asset",
    buildStart() {
      const requireFromApp = createRequire(import.meta.url);
      const source = join(dirname(requireFromApp.resolve("maplibre-gl/package.json")), "dist/maplibre-gl-worker.mjs");
      const targetDir = fileURLToPath(new URL("./public", import.meta.url));
      mkdirSync(targetDir, { recursive: true });
      copyFileSync(source, `${targetDir}/maplibre-gl-worker.mjs`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), maplibreWorkerAsset()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router-dom",
      "lucide-react",
    ],
  },
  server: { port: 5177, strictPort: true },
  build: { target: "es2022", sourcemap: false, chunkSizeWarningLimit: 900 },
});
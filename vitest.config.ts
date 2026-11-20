import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": fileURLToPath(new URL("./apps/console/src", import.meta.url)),
      "@eco-nojin/spatial": fileURLToPath(new URL("./packages/spatial/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    css: false,
    include: ["packages/*/tests/**/*.test.{ts,tsx}", "apps/console/tests/**/*.test.{ts,tsx}", "apps/marketplace/tests/unit/**/*.test.ts", "apps/tourism/tests/unit/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
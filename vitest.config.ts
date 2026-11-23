import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@eco-nojin/api-client": fileURLToPath(new URL("./packages/api-client/src/index.ts", import.meta.url)),
      "@eco-nojin/app-shell": fileURLToPath(new URL("./packages/app-shell/src/index.ts", import.meta.url)),
      "@eco-nojin/auth-client": fileURLToPath(new URL("./packages/auth-client/src/index.ts", import.meta.url)),
      "@eco-nojin/configuration": fileURLToPath(new URL("./packages/configuration/src/index.ts", import.meta.url)),
      "@eco-nojin/design-system": fileURLToPath(new URL("./packages/design-system/src/index.ts", import.meta.url)),
      "@eco-nojin/domain-types": fileURLToPath(new URL("./packages/domain-types/src/index.ts", import.meta.url)),
      "@eco-nojin/frontend-core": fileURLToPath(new URL("./packages/frontend-core/src/index.ts", import.meta.url)),
      "@eco-nojin/hydroma-client": fileURLToPath(new URL("./packages/hydroma-client/src/index.ts", import.meta.url)),
      "@eco-nojin/i18n": fileURLToPath(new URL("./packages/i18n/src/index.ts", import.meta.url)),
      "@eco-nojin/icons": fileURLToPath(new URL("./packages/icons/src/index.ts", import.meta.url)),
      "@eco-nojin/scientific": fileURLToPath(new URL("./packages/scientific/src/index.ts", import.meta.url)),
      "@eco-nojin/spatial": fileURLToPath(new URL("./packages/spatial/src/index.ts", import.meta.url)),
      "@eco-nojin/ui": fileURLToPath(new URL("./packages/ui/src/index.ts", import.meta.url)),
      "@eco-nojin/utilities": fileURLToPath(new URL("./packages/utilities/src/index.ts", import.meta.url)),
      "@eco-nojin/validation": fileURLToPath(new URL("./packages/validation/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    css: false,
    include: ["packages/*/tests/**/*.test.{ts,tsx}", "apps/console/tests/**/*.test.{ts,tsx}", "apps/marketplace/tests/unit/**/*.test.ts", "apps/tourism/tests/unit/**/*.test.ts", "apps/scientific-workspace/tests/**/*.test.{ts,tsx}", "apps/platform/tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
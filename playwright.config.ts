import { defineConfig } from "@playwright/test";

/**
 * Monorepo-level Playwright configuration.
 *
 * Scopes discovery to the live unified platform app (`apps/platform`) and is the
 * single entry point for `pnpm run test:e2e` / `pnpm run test:a11y` from the
 * root. Workspace-scoped runs (`pnpm --filter @eco-nojin/platform run test:e2e`)
 * use `apps/platform/playwright.config.ts`; both files describe the same suite.
 *
 * The real API service is started alongside the platform dev server; the specs
 * sign in through it (see apps/platform/tests/admin-auth.helper.ts).
 */
export default defineConfig({
  testDir: "./apps/platform/tests",
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/node_modules/**", "**/upstream-registry/**", "**/experiments/**"],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  outputDir: "./apps/platform/artifacts/test-results",
  use: {
    baseURL: "http://localhost:5181",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node services/api/src/server.mjs",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { NOJIN_DB: "databases/api/nojin-e2e.db", PORT: "8000", NOJIN_RATE_LIMIT_DISABLED: "true", ...(process.env.NOJIN_HYDROMA_URL ? { NOJIN_HYDROMA_URL: process.env.NOJIN_HYDROMA_URL } : {}) },
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "pnpm run dev",
      cwd: "apps/platform",
      url: "http://localhost:5181",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});
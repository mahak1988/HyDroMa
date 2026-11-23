import { defineConfig } from "@playwright/test";

/**
 * Monorepo-level Playwright configuration.
 *
 * Scopes discovery to the console test directory and is the single entry point
 * for `npm run test:e2e` / `npm run test:a11y` from the root. Workspace-scoped
 * runs (`npm run test:e2e -w @eco-nojin/console`) use
 * `apps/console/playwright.config.ts`; both files describe the same suite.
 *
 * The real API service is started alongside the console dev server; the specs
 * sign in through it (see tests/auth.helper.ts).
 */
export default defineConfig({
  testDir: "./apps/console/tests",
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/node_modules/**", "**/upstream-registry/**", "**/experiments/**"],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  outputDir: "./apps/console/artifacts/test-results",
  use: {
    baseURL: "http://localhost:5175",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node services/api/src/server.mjs",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: true,
      timeout: 60_000,
      env: { NOJIN_DB: "databases/api/nojin-e2e.db", PORT: "8000" },
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm run dev",
      cwd: "apps/console",
      url: "http://localhost:5175",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});

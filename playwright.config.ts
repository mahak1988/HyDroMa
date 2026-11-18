import { defineConfig } from "@playwright/test";

/**
 * Monorepo-level Playwright configuration.
 *
 * Why this file exists: Playwright resolves its configuration from the current
 * working directory only — it does not search sub-directories. Running
 * `playwright test` from the repository root without this file therefore used
 * the built-in defaults (`testDir: "."`), which discovered every `*.spec.*` and
 * `*.test.*` file under the repository, including `experiments/` (POC) and
 * `upstream-registry/` (read-only evidence). That made root-level runs
 * unpredictable and could import third-party test files.
 *
 * This config scopes discovery to the console test directory and is the single
 * entry point for `npm run test:e2e` / `npm run test:a11y` from the root.
 * Workspace-scoped runs (`npm run test:e2e -w @eco-nojin/console`) still use
 * `apps/console/playwright.config.ts`; both files describe the same suite.
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
  webServer: {
    command: "npm run dev",
    cwd: "apps/console",
    url: "http://localhost:5175",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
import { defineConfig } from "@playwright/test";

/**
 * Unified platform e2e. The dev server now serves the whole public core at the
 * root (port 5181) plus the /platform workspace; the API runs alongside so the
 * real session flows are testable.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5181",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node ../../services/api/src/server.mjs",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: true,
      timeout: 60_000,
      env: { NOJIN_DB: "../../databases/api/nojin-e2e.db", PORT: "8000" },
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "pnpm run dev",
      url: "http://localhost:5181",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});

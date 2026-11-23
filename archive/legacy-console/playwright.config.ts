import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  testIgnore: ["**/node_modules/**", "**/upstream-registry/**", "**/upstream-archives/**", "**/experiments/**"],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5175",
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
      command: "npm run dev",
      url: "http://localhost:5175",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});

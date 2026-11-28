import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Phase 3.67 browser smoke: the challenges UI renders against the real app/API
 * (list + create action for an owner). Backend workflow E2E is covered by the
 * real API+SQLite integration test (services/api/tests/challenge-workflow.test.mjs).
 */
test("challenges UI renders against the live app", async ({ page, context }) => {
  await ensureSignedIn(context);
  await page.goto("/platform/challenges");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /افزودن چالش|add challenge/i })).toBeVisible();
});
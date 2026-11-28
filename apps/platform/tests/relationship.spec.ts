import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Territory → Project relationship E2E against the real API + SQLite.
 * Proves the relationship is persisted (survives reload) and that deleting the
 * project does not delete the related territory.
 */
test("territory→project: relate, persist across reload, and keep the territory on project delete", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const territoryName = `E2E Territory ${stamp}`;
  const projectName = `E2E Project ${stamp}`;

  // Create a territory.
  await page.goto("/platform/territories");
  await page.getByRole("button", { name: /افزودن قلمرو|add territory/i }).click();
  await page.getByLabel(/نام|name/i).fill(territoryName);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(territoryName)).toBeVisible();

  // Create a project linked to that territory.
  await page.goto("/platform/projects");
  await page.getByRole("button", { name: /افزودن پروژه|add project/i }).click();
  await page.getByLabel(/نام|name/i).fill(projectName);
  await page.getByLabel(/قلمرو|territory/i).selectOption({ label: territoryName });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(projectName)).toBeVisible();
  await expect(page.getByRole("link", { name: territoryName })).toBeVisible();

  // Persistence: reload and the link is still resolved from stored data.
  await page.reload();
  await expect(page.getByRole("link", { name: territoryName })).toBeVisible();

  // Delete the project; the territory must remain (no cascade).
  await page.getByRole("button", { name: /حذف|delete/i }).first().click();
  await page.getByRole("button", { name: /تأیید|confirm/i }).click();
  await expect(page.getByText(projectName)).toHaveCount(0);

  await page.goto("/platform/territories");
  await expect(page.getByText(territoryName)).toBeVisible();
});
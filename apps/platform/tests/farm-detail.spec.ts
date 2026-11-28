import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Agricultural workflow E2E: create a farm, create a project linked to it, open
 * the farm detail, verify the related project, reload (persist).
 */
test("farm detail: linked projects are visible and persist across reload", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farm = `E2E Farm ${stamp}`;
  const project = `E2E Project ${stamp}`;

  await page.goto("/platform/agriculture");
  await page.getByRole("button", { name: /افزودن مزرعه|add farm/i }).click();
  await page.getByLabel(/نام|name/i).fill(farm);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(farm)).toBeVisible();

  await page.goto("/platform/projects");
  await page.getByRole("button", { name: /افزودن پروژه|add project/i }).click();
  await page.getByLabel(/نام|name/i).fill(project);
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: farm });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(project)).toBeVisible();

  // Open the farm detail via the farm name link.
  await page.goto("/platform/agriculture");
  await page.getByRole("link", { name: farm }).click();
  await expect(page.getByRole("heading", { name: farm })).toBeVisible();
  await expect(page.getByRole("link", { name: project })).toBeVisible();

  // Persistence across reload.
  await page.reload();
  await expect(page.getByRole("heading", { name: farm })).toBeVisible();
  await expect(page.getByRole("link", { name: project })).toBeVisible();
});
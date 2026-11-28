import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Project management workflow E2E: create related entities, create a project,
 * open its detail, verify resolved relationships, reload (persist).
 */
test("project detail: create with relationships, open detail, persist across reload", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const territory = `E2E Terr ${stamp}`;
  const village = `E2E Vill ${stamp}`;
  const farm = `E2E Farm ${stamp}`;
  const project = `E2E Project ${stamp}`;

  await page.goto("/platform/territories");
  await page.getByRole("button", { name: /افزودن قلمرو|add territory/i }).click();
  await page.getByLabel(/نام|name/i).fill(territory);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(territory)).toBeVisible();

  await page.goto("/platform/communities");
  await page.getByRole("button", { name: /افزودن روستا|add village/i }).click();
  await page.getByLabel(/نام|name/i).fill(village);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(village)).toBeVisible();

  await page.goto("/platform/agriculture");
  await page.getByRole("button", { name: /افزودن مزرعه|add farm/i }).click();
  await page.getByLabel(/نام|name/i).fill(farm);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(farm)).toBeVisible();

  await page.goto("/platform/projects");
  await page.getByRole("button", { name: /افزودن پروژه|add project/i }).click();
  await page.getByLabel(/نام|name/i).fill(project);
  await page.getByLabel(/قلمرو|territory/i).selectOption({ label: territory });
  await page.getByLabel(/روستا|village/i).selectOption({ label: village });
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: farm });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(project)).toBeVisible();

  // Open detail via the project name link.
  await page.getByRole("link", { name: project }).click();
  await expect(page.getByRole("heading", { name: project })).toBeVisible();
  await expect(page.getByRole("link", { name: territory })).toBeVisible();
  await expect(page.getByRole("link", { name: village })).toBeVisible();
  await expect(page.getByRole("link", { name: farm })).toBeVisible();

  // Persistence across reload.
  await page.reload();
  await expect(page.getByRole("heading", { name: project })).toBeVisible();
  await expect(page.getByRole("link", { name: farm })).toBeVisible();
});
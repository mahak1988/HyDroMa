import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Village → Project relationship E2E against the real API + SQLite.
 * Create village, link project, reload (persist), reassign, clear, delete project
 * (village remains).
 */
test("village→project: link, persist, reassign, clear, and keep village on project delete", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const v1 = `E2E Village A ${stamp}`;
  const v2 = `E2E Village B ${stamp}`;
  const project = `E2E Project ${stamp}`;

  // Two villages.
  await page.goto("/platform/communities");
  for (const name of [v1, v2]) {
    await page.getByRole("button", { name: /افزودن روستا|add village/i }).click();
    await page.getByLabel(/نام|name/i).fill(name);
    await page.getByRole("button", { name: /ذخیره|save/i }).click();
    await expect(page.getByText(name)).toBeVisible();
  }

  // Project linked to v1.
  await page.goto("/platform/projects");
  await page.getByRole("button", { name: /افزودن پروژه|add project/i }).click();
  await page.getByLabel(/نام|name/i).fill(project);
  await page.getByLabel(/روستا|village/i).selectOption({ label: v1 });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByRole("link", { name: v1 })).toBeVisible();

  // Persist across reload.
  await page.reload();
  await expect(page.getByRole("link", { name: v1 })).toBeVisible();

  // Reassign to v2.
  await page.getByRole("button", { name: /ویرایش|edit/i }).first().click();
  await page.getByLabel(/روستا|village/i).selectOption({ label: v2 });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByRole("link", { name: v2 })).toBeVisible();

  // Clear.
  await page.getByRole("button", { name: /ویرایش|edit/i }).first().click();
  await page.getByLabel(/روستا|village/i).selectOption("");
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(/بدون روستا|no village/i).first()).toBeVisible();

  // Delete project; villages remain.
  await page.getByRole("button", { name: /حذف|delete/i }).first().click();
  await page.getByRole("button", { name: /تأیید|confirm/i }).click();
  await expect(page.getByText(project)).toHaveCount(0);
  await page.goto("/platform/communities");
  await expect(page.getByText(v1)).toBeVisible();
  await expect(page.getByText(v2)).toBeVisible();
});
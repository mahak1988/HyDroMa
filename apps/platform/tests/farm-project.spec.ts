import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Farm → Project relationship E2E against the real API + SQLite.
 * Link, reload (persist), reassign, clear, delete project (farm remains).
 */
test("farm→project: link, persist, reassign, clear, and keep farm on project delete", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const f1 = `E2E Farm A ${stamp}`;
  const f2 = `E2E Farm B ${stamp}`;
  const project = `E2E Project ${stamp}`;

  await page.goto("/platform/agriculture");
  for (const name of [f1, f2]) {
    await page.getByRole("button", { name: /افزودن مزرعه|add farm/i }).click();
    await page.getByLabel(/نام|name/i).fill(name);
    await page.getByRole("button", { name: /ذخیره|save/i }).click();
    await expect(page.getByText(name)).toBeVisible();
  }

  await page.goto("/platform/projects");
  await page.getByRole("button", { name: /افزودن پروژه|add project/i }).click();
  await page.getByLabel(/نام|name/i).fill(project);
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: f1 });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByRole("link", { name: f1 })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: f1 })).toBeVisible();

  await page.getByRole("button", { name: /ویرایش|edit/i }).first().click();
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: f2 });
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByRole("link", { name: f2 })).toBeVisible();

  await page.getByRole("button", { name: /ویرایش|edit/i }).first().click();
  await page.getByLabel(/مزرعه|farm/i).selectOption("");
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(/بدون مزرعه|no farm/i).first()).toBeVisible();

  await page.getByRole("button", { name: /حذف|delete/i }).first().click();
  await page.getByRole("button", { name: /تأیید|confirm/i }).click();
  await expect(page.getByText(project)).toHaveCount(0);
  await page.goto("/platform/agriculture");
  await expect(page.getByText(f1)).toBeVisible();
  await expect(page.getByText(f2)).toBeVisible();
});
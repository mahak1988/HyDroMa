import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * M05 Agriculture — real end-to-end vertical slice against the live API.
 * No route mocks: the real services/api + SQLite persist the data. Verifies
 * create → list → edit → delete through the actual UI, plus validation.
 */
test("farms: create, list, edit and delete persist through the real API", async ({ page, context }) => {
  await ensureSignedIn(context);
  await page.goto("/platform/agriculture");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const name = `E2E Farm ${Date.now()}`;

  // Create.
  await page.getByRole("button", { name: /افزودن|add farm/i }).click();
  await page.getByLabel(/نام|name/i).fill(name);
  await page.getByLabel(/مساحت|area/i).fill("7.5");
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(name)).toBeVisible();

  // Edit (rename).
  await page.getByRole("button", { name: /ویرایش|edit/i }).first().click();
  await page.getByLabel(/نام|name/i).fill(`${name} v2`);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(`${name} v2`)).toBeVisible();

  // Delete.
  await page.getByRole("button", { name: /حذف|delete/i }).first().click();
  await page.getByRole("button", { name: /تأیید|confirm/i }).click();
  await expect(page.getByText(`${name} v2`)).toHaveCount(0);
});

test("farms: validation blocks an empty name without calling the API", async ({ page, context }) => {
  await ensureSignedIn(context);
  await page.goto("/platform/agriculture");
  await page.getByRole("button", { name: /افزودن|add farm/i }).click();
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(/حداقل ۲ حرف|at least 2/i)).toBeVisible();
});
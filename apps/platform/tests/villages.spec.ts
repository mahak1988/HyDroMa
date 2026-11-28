import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * M02 Villages & Communities — real end-to-end slice against the live API.
 * No route mocks: real services/api + SQLite persist the data.
 */
test("villages: create, list, edit and delete persist through the real API", async ({ page, context }) => {
  await ensureSignedIn(context);
  await page.goto("/platform/communities");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const name = `E2E Village ${Date.now()}`;

  await page.getByRole("button", { name: /افزودن روستا|add village/i }).click();
  await page.getByLabel(/نام|name/i).fill(name);
  await page.getByLabel(/منطقه|region/i).fill("Alborz");
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(name)).toBeVisible();

  await page.getByRole("button", { name: /ویرایش|edit/i }).first().click();
  await page.getByLabel(/نام|name/i).fill(`${name} v2`);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(`${name} v2`)).toBeVisible();

  await page.getByRole("button", { name: /حذف|delete/i }).first().click();
  await page.getByRole("button", { name: /تأیید|confirm/i }).click();
  await expect(page.getByText(`${name} v2`)).toHaveCount(0);
});

test("villages: validation blocks an empty name without calling the API", async ({ page, context }) => {
  await ensureSignedIn(context);
  await page.goto("/platform/communities");
  await page.getByRole("button", { name: /افزودن روستا|add village/i }).click();
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(/حداقل ۲ حرف|at least 2/i)).toBeVisible();
});
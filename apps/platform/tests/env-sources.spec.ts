import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Env source registry E2E (fresh server): catalog a source (no live acquisition). */
test("env sources: add a catalogued source, visible with notice", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  await page.goto("/platform/hydroma/sources");
  await expect(page.getByText(/LIVE ACQUISITION AND SCIENTIFIC EXECUTION NOT AUTHORIZED|دریافت زنده و اجرای علمی مجاز نیست/)).toBeVisible();
  await page.getByRole("button", { name: /افزودن منبع|add source/i }).click();
  await page.getByLabel(/نام|name/i).fill(`ECMWF ${stamp}`);
  await page.getByLabel(/ارائه‌دهنده|provider/i).fill("ECMWF");
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(`ECMWF ${stamp}`)).toBeVisible();
  const list = (await (await page.request.get("/api/v1/env/sources")).json()).items as any[];
  const s = list.find((x) => x.name === `ECMWF ${stamp}`)!;
  expect(s.integrationStatus).toBe("CATALOGUED");
  expect(s.id).toBeTruthy();
});
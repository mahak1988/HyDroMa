import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Irrigation operations E2E against the real API + SQLite. */
test("irrigation: record an event linked to a farm and persist across reload", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farm = `E2E Farm ${stamp}`;

  await page.goto("/platform/agriculture");
  await page.getByRole("button", { name: /افزودن مزرعه|add farm/i }).click();
  await page.getByLabel(/نام|name/i).fill(farm);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(farm).first()).toBeVisible();

  await page.goto("/platform/irrigation");
  await page.getByRole("button", { name: /افزودن رویداد|add event/i }).click();
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: farm });
  await page.getByLabel(/مقدار|quantity/i).fill("12.5");
  await page.locator("#irr-occurred").fill("2026-05-01T08:00");
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByRole("cell", { name: farm })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("cell", { name: farm })).toBeVisible();
});
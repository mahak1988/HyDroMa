import { expect, test } from "@playwright/test";

const WIDTHS = [360, 390, 768, 1280, 1440, 1920];

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(
      () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("renders main + primary heading with valid lang/dir", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const lang = await page.evaluate(() => document.documentElement.lang);
  const dir = await page.evaluate(() => document.documentElement.dir);
  expect(["fa", "en", "ar"]).toContain(lang);
  expect(["rtl", "ltr"]).toContain(dir);
  expect(errors).toEqual([]);
});
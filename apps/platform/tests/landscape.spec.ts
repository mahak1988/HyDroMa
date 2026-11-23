import { expect, test } from "@playwright/test";

/**
 * Landscape management section e2e — internal to the unified platform SPA and
 * served under `/landscape`. The section reuses the platform workspace shell and
 * the shared page registry, so the routes mirror the platform pages.
 */
const ROUTES = [
  "/landscape",
  "/landscape/landscapes",
  "/landscape/landscapes/villages",
  "/landscape/landscapes/nomadic-territories",
  "/landscape/landscapes/rangelands",
  "/landscape/landscapes/farms",
  "/landscape/landscapes/assessment",
  "/landscape/landscapes/management-plan",
  "/landscape/landscapes/monitoring",
  "/landscape/landscapes/reports",
  "/landscape/landscapes/atlas",
  "/landscape/landscapes/kondor",
];

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("eco.locale", "en"));
});

for (const route of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("the sidebar links stay inside the landscape section", async ({ page }) => {
  await page.goto("/landscape/landscapes/villages");
  await expect(page.locator(".pl-nav a").first()).toHaveAttribute("href", /\/landscape\//u);
  const rowLink = page.locator('a[href="/landscape/landscapes/kondor"]').first();
  await expect(rowLink).toBeVisible();
  await rowLink.click();
  await expect(page).toHaveURL(/\/landscape\/landscapes\/kondor$/u);
});

test("the landscape section renders RTL in Persian", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("eco.locale", "fa"));
  await page.goto("/landscape");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
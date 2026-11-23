import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Zero-tolerance accessibility gate for the unified platform.
 * Public core routes + the /platform workspace. No rule is disabled.
 */
const routes = [
  "/",
  "/ecosystem",
  "/hydroma",
  "/mrv",
  "/knowledge",
  "/about",
  "/contact",
  "/partner",
  "/login",
  "/platform",
  "/platform/landscapes",
  "/platform/projects",
  "/landscape",
  "/landscape/landscapes",
  "/landscape/landscapes/villages",
  "/landscape/landscapes/assessment",
  "/landscape/landscapes/kondor",
];

for (const route of routes) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

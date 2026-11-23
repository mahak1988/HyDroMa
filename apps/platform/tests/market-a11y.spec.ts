import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Zero-tolerance accessibility gate for the marketplace section inside the
 * unified platform. Guest-reachable routes only; the seller dashboard needs a
 * real seller session and is covered by the market e2e gate.
 */
const ROUTES = [
  "/market",
  "/market/catalog",
  "/market/categories",
  "/market/stores",
  "/market/p/saffron-kondor",
  "/market/s/kondor-village",
  "/market/cart",
  "/market/checkout",
  "/market/orders",
  "/market/seller/signin",
];

for (const locale of ["en", "fa"]) {
  for (const theme of ["light", "dark"]) {
    for (const route of ROUTES) {
      test(`axe: ${locale} ${theme} ${route}`, async ({ page }) => {
        await page.addInitScript(
          (options: { locale: string; theme: string }) => {
            window.localStorage.setItem("eco.locale", options.locale);
            window.localStorage.setItem("eco.theme", options.theme);
          },
          { locale, theme },
        );
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  }
}
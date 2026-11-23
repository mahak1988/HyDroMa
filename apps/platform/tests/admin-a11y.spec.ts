import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Zero-tolerance accessibility gate for the administration section. Every route
 * is authenticated and checked in both shipped languages and both themes.
 */
const ROUTES = [
  "/landscape/admin",
  "/landscape/admin/components",
  "/landscape/admin/notifications",
  "/landscape/admin/organizations",
  "/landscape/admin/users",
  "/landscape/admin/profile",
  "/landscape/admin/security",
];

for (const locale of ["en", "fa"]) {
  for (const theme of ["light", "dark"]) {
    for (const route of ROUTES) {
      test(`axe: ${locale} ${theme} ${route}`, async ({ page, context }) => {
        await ensureSignedIn(context);
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
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  }
}
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/ecosystem",
  "/hydroma",
  "/landscape",
  "/marketplace",
  "/tourism",
  "/mrv",
  "/knowledge",
  "/about",
  "/contact",
  "/partner",
  "/login",
];

for (const locale of ["fa", "en"]) {
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

        const violations = results.violations;
        expect(
          violations,
          violations
            .map((violation) => `${violation.id} (${violation.impact}): ${violation.help} — nodes ${violation.nodes.length}`)
            .join("\n"),
        ).toEqual([]);
      });
    }
  }
}
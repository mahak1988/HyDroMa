import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Zero-tolerance accessibility gate for the shell.
 * Every route × every shipped locale × both themes. No rule is disabled.
 */
const routes = [
  "/",
  "/components",
  "/notifications",
  "/settings",
  "/organizations",
  "/organizations/org-karaj",
  "/users",
  "/users/usr-sara",
];

for (const locale of ["fa", "en", "ar"]) {
  for (const theme of ["light", "dark"]) {
    for (const route of routes) {
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
            .map(
              (violation) =>
                `${violation.id} (${violation.impact}): ${violation.help} — nodes ${violation.nodes.length}`,
            )
            .join("\n"),
        ).toEqual([]);
      });
    }
  }
}
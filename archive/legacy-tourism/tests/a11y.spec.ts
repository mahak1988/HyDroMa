import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/destinations",
  "/destinations/kondor-village",
  "/nomadic",
  "/nomadic/taleghan-migration",
  "/stays",
  "/stays/kondor-homestay",
  "/experiences",
  "/events",
  "/host",
  "/map",
];

for (const locale of ["fa", "en", "ar"]) {
  for (const theme of ["light", "dark"]) {
    for (const route of ROUTES) {
      test(`axe: ${locale} ${theme} ${route}`, async ({ page }) => {
        await page.addInitScript(
          (options: { locale: string; theme: string }) => {
            window.localStorage.setItem("eco.locale", options.locale);
            window.localStorage.setItem("eco.theme", options.theme);
            // The host workspace is gated; sign in as the demo host.
            window.localStorage.setItem("eco.tourism.host", "1");
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
          violations.map((v) => `${v.id} (${v.impact}): ${v.help} — nodes ${v.nodes.length}`).join("\n"),
        ).toEqual([]);
      });
    }
  }
}
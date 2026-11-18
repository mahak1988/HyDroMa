import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/water", "/soil", "/climate", "/vegetation", "/remote-sensing", "/map", "/simulation", "/projects"];

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
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (route === "/map" || route === "/remote-sensing") {
          await page.locator("canvas.maplibregl-canvas").first().waitFor({ state: "visible", timeout: 30_000 });
        }

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
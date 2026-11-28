import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Zero-tolerance accessibility gate for the unified platform.
 * Public core routes + the /platform workspace. No rule is disabled.
 * The workspace is session-gated, so /platform routes sign in first.
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
  "/vision",
  "/impact",
  "/landscapes",
  "/projects",
  "/technology",
  "/partners",
  "/accessibility",
  "/privacy",
  "/terms",
  "/platform",
  "/platform/landscapes",
  "/platform/projects",
  "/platform/agriculture",
  "/platform/marketplace",
  "/platform/hydroma",
  "/platform/community",
  "/platform/inventory",
  "/platform/administration",
  "/landscape",
  "/landscape/landscapes",
  "/landscape/landscapes/villages",
  "/landscape/landscapes/assessment",
  "/landscape/landscapes/kondor",
  "/landscape/field",
  "/landscape/field/survey",
  "/landscape/field/records",
  "/landscape/field/map",
];

for (const route of routes) {
  test(`axe: ${route}`, async ({ page, context }) => {
    if (route === "/platform" || route.startsWith("/platform/")) {
      await ensureSignedIn(context);
    }
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

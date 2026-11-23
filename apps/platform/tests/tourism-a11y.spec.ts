import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Zero-tolerance accessibility gate for the tourism section inside the unified
 * platform. Guest-reachable routes only; host routes need a real session and are
 * covered by the tourism e2e suite.
 */
const ROUTES = [
  "/tourism",
  "/tourism/destinations",
  "/tourism/destinations/kondor-village",
  "/tourism/nomadic",
  "/tourism/nomadic/taleghan-migration",
  "/tourism/stays",
  "/tourism/stays/kondor-homestay",
  "/tourism/experiences",
  "/tourism/experiences/kondor-harvest-walk",
  "/tourism/events",
  "/tourism/map",
  "/tourism/host/signin",
];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("eco.locale", "en");
      window.localStorage.setItem("eco.theme", "light");
    });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("axe: tourism renders RTL in Persian", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("eco.locale", "fa");
    window.localStorage.setItem("eco.theme", "light");
  });
  await page.goto("/tourism");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
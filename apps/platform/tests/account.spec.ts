import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Public-core account pages (`/profile`, `/security`) — same real console pages,
 * now reachable from the unified public core. Guest access shows the real
 * sign-in panel; signed-in access renders the account page.
 */
test("a guest sees the sign-in panel on /profile", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: /Sign in|Login|وارد|تسجيل/ })).toBeVisible();
});

test("a signed-in owner sees profile and can open security", async ({ page, context }) => {
  await ensureSignedIn(context);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();

  await page.locator('a[href="/security"]').first().click();
  await expect(page).toHaveURL(/\/security$/u);
  await expect(page.getByRole("heading", { level: 1, name: "Security" })).toBeVisible();
});

for (const theme of ["light", "dark"]) {
  for (const route of ["/profile", "/security"]) {
    test(`axe: ${theme} ${route}`, async ({ page, context }) => {
      await ensureSignedIn(context);
      await page.addInitScript((mode: string) => {
        window.localStorage.setItem("eco.locale", "en");
        window.localStorage.setItem("eco.theme", mode);
      }, theme);
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}
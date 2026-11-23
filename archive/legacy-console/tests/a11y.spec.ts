import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureSignedIn, ownOrganizationId } from "./auth.helper";

/**
 * Zero-tolerance accessibility gate for the shell.
 * Every route × every shipped locale × both themes. No rule is disabled.
 */
const staticRoutes = ["/", "/components", "/notifications", "/settings", "/organizations", "/users"];

async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations;
}

for (const locale of ["fa", "en", "ar"]) {
  for (const theme of ["light", "dark"]) {
    for (const route of staticRoutes) {
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
        const violations = await runAxe(page);
        expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
      });
    }

    test(`axe: ${locale} ${theme} organization detail`, async ({ page, context }) => {
      await ensureSignedIn(context);
      const orgId = await ownOrganizationId(context);
      await page.addInitScript(
        (options: { locale: string; theme: string }) => {
          window.localStorage.setItem("eco.locale", options.locale);
          window.localStorage.setItem("eco.theme", options.theme);
        },
        { locale, theme },
      );
      await page.goto(`/organizations/${orgId}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const violations = await runAxe(page);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });

    test(`axe: ${locale} ${theme} user detail`, async ({ page, context }) => {
      await ensureSignedIn(context);
      const orgId = await ownOrganizationId(context);
      const members = (await (
        await context.request.get(`http://127.0.0.1:8000/v1/organizations/${orgId}/members`)
      ).json()) as { items: Array<{ user: { id: string } }> };
      const userId = members.items[0]?.user.id;
      test.skip(!userId, "no members in the e2e organization yet");
      await page.addInitScript(
        (options: { locale: string; theme: string }) => {
          window.localStorage.setItem("eco.locale", options.locale);
          window.localStorage.setItem("eco.theme", options.theme);
        },
        { locale, theme },
      );
      await page.goto(`/users/${userId}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const violations = await runAxe(page);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
}

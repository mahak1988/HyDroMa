import { expect, test } from "@playwright/test";
import { ensureSignedIn, ownOrganizationId, API_BASE } from "./admin-auth.helper";

const RUN = Date.now();

/**
 * Administration section e2e — the console workspace is now internal to the
 * unified platform at `/landscape/admin`. Every route is behind the real API
 * session; there is no demo role switch.
 */
const ROUTES = [
  "/landscape/admin",
  "/landscape/admin/components",
  "/landscape/admin/notifications",
  "/landscape/admin/organizations",
  "/landscape/admin/users",
  "/landscape/admin/profile",
  "/landscape/admin/security",
  "/landscape/admin/settings",
];

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ context }) => {
  await ensureSignedIn(context);
});

for (const route of ROUTES) {
  test(`renders ${route} for a signed-in owner`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("a guest sees the real sign-in panel instead of the shell", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/landscape/admin");
  await expect(page.getByRole("heading", { name: /Sign in|Login|وارد|تسجيل/ })).toBeVisible();
  await expect(page.locator(".pl-sidebar")).toHaveCount(0);
});

test("unknown admin routes render the not-found page", async ({ page }) => {
  await page.goto("/landscape/admin/does-not-exist");
  await expect(page.locator("body")).toContainText(/404|not found|یافت نشد/);
});

test("creates an organization and opens its detail page", async ({ page }) => {
  await page.goto("/landscape/admin/organizations");
  await expect(page.getByRole("heading", { level: 1, name: "Organizations" })).toBeVisible();
  await page.getByRole("button", { name: "New organization" }).click();

  await page.locator("#org-name").fill(`Admin Test Watershed ${RUN}`);
  await expect(page.locator("#org-slug")).toHaveValue(`admin-test-watershed-${RUN}`);
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect(page.getByRole("heading", { level: 1, name: `Admin Test Watershed ${RUN}` })).toBeVisible();
  await expect(page).toHaveURL(/\/landscape\/admin\/organizations\/[\w-]+$/);
});

test("invites a member through the real API", async ({ page, context }) => {
  const orgId = await ownOrganizationId(context);
  await page.goto(`/landscape/admin/organizations/${orgId}`);
  await page.getByRole("button", { name: "Invite user" }).click();
  await page.locator("#invite-email").fill(`admin-${RUN}@nojin-e2e.test`);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Invitation created" })).toBeVisible();
  expect(API_BASE).toContain("127.0.0.1");
});
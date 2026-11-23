import { expect, test } from "@playwright/test";
import { ensureSignedIn, ownOrganizationId, API_BASE } from "./auth.helper";

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ context }) => {
  await ensureSignedIn(context);
});

test.describe("organizations", () => {
  test("creates an organization and opens its detail page", async ({ page }) => {
    await page.goto("/organizations");
    await expect(page.getByRole("heading", { level: 1, name: "Organizations" })).toBeVisible();
    await page.getByRole("button", { name: "New organization" }).click();

    await page.locator("#org-name").fill("Test Watershed");
    await expect(page.locator("#org-slug")).toHaveValue("test-watershed");
    await page.locator("#org-country").fill("IR");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Test Watershed" })).toBeVisible();
    await expect(page).toHaveURL(/\/organizations\/[\w-]+$/);
  });

  test("invites a member through the real API", async ({ page, context }) => {
    const orgId = await ownOrganizationId(context);
    await page.goto(`/organizations/${orgId}`);
    await page.getByRole("button", { name: "Invite user" }).click();
    await page.locator("#invite-email").fill("new.member@nojin-e2e.test");
    await page.getByRole("button", { name: "Invite", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Invitation created" })).toBeVisible();
  });

  test("changes a member role", async ({ page, context }) => {
    const orgId = await ownOrganizationId(context);

    // Invite a member through the API, then manage them through the UI.
    const request = context.request;
    const invite = await request.post(`${API_BASE}/v1/organizations/${orgId}/invitations`, {
      data: { email: "role-change@nojin-e2e.test", role: "member" },
    });
    if (invite.status() === 409) throw new Error("member already active; use a fresh e2e database");
    expect(invite.status()).toBe(201);

    await page.goto(`/organizations/${orgId}`);
    const roleSelect = page.getByLabel(/Role — role-change@nojin-e2e\.test/);
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption("manager");
    await expect(roleSelect).toHaveValue("manager");
  });

  test("a foreign organization is not accessible", async ({ page, context }) => {
    // Create a second account with its own organization, then try to open it
    // from the first account's session: the API must answer 404.
    const request = context.request;
    const foreign = await request.post(`${API_BASE}/v1/auth/register`, {
      data: {
        email: "foreign-owner@nojin-e2e.test",
        name: "Foreign Owner",
        password: "foreign-owner-password-1",
        organizationName: "Foreign Institute",
      },
    });
    const foreignOrgs = foreign.ok()
      ? ((await foreign.json()) as { organizations: Array<{ id: string }> }).organizations
      : [];
    let foreignOrgId = foreignOrgs[0]?.id;
    if (!foreignOrgId) {
      // Already registered on a previous run: sign in as them and read the org.
      await request.post(`${API_BASE}/v1/auth/login`, {
        data: { email: "foreign-owner@nojin-e2e.test", password: "foreign-owner-password-1" },
      });
      const cookies = await context.cookies(`${API_BASE}`);
      const sessionCookie = cookies.find((cookie) => cookie.name === "nojin_session");
      foreignOrgId = sessionCookie
        ? ((await (await request.get(`${API_BASE}/v1/organizations`)).json()) as { items: Array<{ id: string }> }).items[0]?.id
        : undefined;
      // Restore the owner session for the page below.
      await ensureSignedIn(context);
    }
    if (!foreignOrgId) throw new Error("could not resolve a foreign organization id");

    await page.goto(`/organizations/${foreignOrgId}`);
    await expect(page.getByRole("heading", { level: 1, name: "Organization not found" })).toBeVisible();
  });
});

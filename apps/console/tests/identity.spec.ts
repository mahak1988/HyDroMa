import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("eco.locale", "en");
    window.localStorage.setItem("eco.theme", "light");
  });
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
    await expect(page).toHaveURL(/\/organizations\/org-test-watershed-/);
  });

  test("invites a member", async ({ page }) => {
    await page.goto("/organizations/org-karaj");
    await page.getByRole("button", { name: "Invite user" }).click();
    await page.locator("#invite-email").fill("new.person@ecnojin.demo");
    await page.getByRole("button", { name: "Invite", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Invitation created" })).toBeVisible();
  });

  test("changes a member role", async ({ page }) => {
    await page.goto("/organizations/org-karaj");
    const roleSelect = page.getByLabel(/Role — Sara Ahmadi/);
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption("manager");
    await expect(roleSelect).toHaveValue("manager");
  });

  test("cross-tenant organization is not accessible", async ({ page }) => {
    await page.goto("/organizations/org-hidden");
    await expect(page.getByRole("heading", { level: 1, name: "Organization not found" })).toBeVisible();
  });
});

test.describe("tenancy in the session", () => {
  test("switching to a viewer organization removes write actions", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("button", { name: "Invite user" })).toBeVisible();

    await page.getByRole("button", { name: /Karaj Watershed Council/ }).first().click();
    await page.getByRole("menuitem", { name: /Zagros Field Institute/ }).click();

    await expect(page.getByRole("button", { name: "Invite user" })).toHaveCount(0);
  });
});

test.describe("users", () => {
  test("filters by search and role", async ({ page }) => {
    await page.goto("/users");
    await expect(page.locator("tbody tr")).toHaveCount(5);

    await page.locator("#user-search").fill("Sara");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr")).toContainText("Sara Ahmadi");

    await page.locator("#user-search").fill("");
    await page.locator("#user-role").selectOption("viewer");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr")).toContainText("Reza Nasser");
  });

  test("edits a user and suspends them", async ({ page }) => {
    await page.goto("/users/usr-sara");
    await expect(page.getByRole("heading", { level: 1, name: "Sara Ahmadi" })).toBeVisible();

    await page.locator("#person-phone").fill("+98 912 000 1111");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status").filter({ hasText: "User updated" })).toBeVisible();

    await page.getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByRole("status").filter({ hasText: "User suspended" })).toBeVisible();
    await expect(page.getByText("Suspended").first()).toBeVisible();
  });

  test("non-member user returns not-found", async ({ page }) => {
    await page.goto("/users/usr-mina");
    await expect(page.getByRole("heading", { level: 1, name: "User not found" })).toBeVisible();
  });
});
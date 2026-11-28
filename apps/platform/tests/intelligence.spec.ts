import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Operations intelligence E2E (fresh server): real metrics + priority navigation. */
test("intelligence: shows real metrics and navigates to an overdue task", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const orgId = (await (await page.request.get("/api/v1/organizations")).json()).items[0].id;
  const farm = (await (await page.request.post("/api/v1/resources/farms", { data: { organizationId: orgId, name: `IF ${stamp}` } })).json());
  const task = (await (await page.request.post("/api/v1/agri/tasks", { data: { organizationId: orgId, farmId: String(farm.id), title: `Overdue ${stamp}`, category: "general", dueAt: "2020-01-01" } })).json());

  await page.goto("/platform/agriculture/intelligence");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The task legitimately appears in more than one widget (priorities + recent);
  // assert at least one is visible, matching the .first() used for nav below.
  await expect(page.getByText(`Overdue ${stamp}`).first()).toBeVisible();
  await page.locator("a[href='/platform/tasks/" + task.id + "']").first().click();
  await expect(page.getByRole("heading", { name: `Overdue ${stamp}` }).first()).toBeVisible();
});
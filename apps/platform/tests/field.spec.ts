import { expect, test } from "@playwright/test";
import { ensureHostSession } from "./tourism-auth.helper";

/**
 * Field collection section e2e — nested at `/landscape/field` inside the
 * unified platform. The queue is local-first; a real session syncs each record
 * to `/v1/resources/surveys` and the API decides `synced` / `failed`.
 */
const API_BASE = process.env.E2E_API_BASE ?? "http://127.0.0.1:8000";

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("eco.locale", "en"));
});

for (const route of ["/landscape/field", "/landscape/field/survey", "/landscape/field/records", "/landscape/field/map"]) {
  test(`renders ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("a guest record stays queued as pending", async ({ page }) => {
  await page.goto("/landscape/field/survey");
  await page.getByLabel(/Survey|نظرسنجی|استبيان/).fill("Guest terrace");
  await page.getByRole("button", { name: /Save|ذخیره|حفظ/ }).click();

  await page.goto("/landscape/field/records");
  await expect(page.getByText("Guest terrace")).toBeVisible();
  await expect(page.getByText("pending")).toBeVisible();
});

test("a signed-in record syncs for real and is listed by the API", async ({ page, context }) => {
  await ensureHostSession(context);
  await page.goto("/landscape/field/survey");
  await page.getByLabel(/Survey|نظرسنجی|استبيان/).fill("Synced terrace");
  await page.getByPlaceholder(/Notes|یادداشت/).fill("Soil sample 12");
  await page.getByRole("button", { name: /Save|ذخیره|حفظ/ }).click();

  await page.goto("/landscape/field/records");
  await expect(page.getByText("Synced terrace")).toBeVisible();
  // Exact match: the status badge "synced" must not collide with the title "Synced terrace".
  await expect(page.getByText("synced", { exact: true })).toBeVisible({ timeout: 15_000 });

  const response = await context.request.get(`${API_BASE}/v1/resources/surveys`);
  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as { items: Array<{ siteName?: string }> };
  expect(payload.items.some((item) => item.siteName === "Synced terrace")).toBe(true);
});

test("a failed sync is marked failed, never synced", async ({ page, context }) => {
  await ensureHostSession(context);
  await page.route("**/api/v1/resources/surveys", (route) => route.abort("failed"));
  await page.goto("/landscape/field/survey");
  await page.getByLabel(/Survey|نظرسنجی|استبيان/).fill("Failing terrace");
  await page.getByRole("button", { name: /Save|ذخیره|حفظ/ }).click();

  await page.goto("/landscape/field/records");
  await expect(page.getByText("Failing terrace")).toBeVisible();
  await expect(page.getByText("failed")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("synced")).toHaveCount(0);
});
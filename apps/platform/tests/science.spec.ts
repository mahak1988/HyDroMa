import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ensureSignedIn, API_BASE } from "./admin-auth.helper";

/**
 * Science section e2e — internal to the unified platform at `/science`.
 * The HyDroMA client is untouched; unreachable engine states must be explicit,
 * never replaced by demo data.
 */
const ROUTES = [
  "/science",
  "/science/water",
  "/science/soil",
  "/science/climate",
  "/science/vegetation",
  "/science/remote-sensing",
  "/science/map",
  "/science/simulation",
  "/science/scenarios",
  "/science/projects",
  "/science/models",
  "/science/run",
];

test.use({ viewport: { width: 1440, height: 1000 } });

for (const route of ROUTES) {
  test(`renders ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("models page is explicit when the engine is unavailable", async ({ page }) => {
  await page.route("**/v1/models", (route) => route.abort("failed"));
  await page.goto("/science/models");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/invented|mock data/i);
});

test("recorded runs are listed through the real API", async ({ context }) => {
  await ensureSignedIn(context);
  const created = await context.request.post(`${API_BASE}/v1/resources/runs`, {
    data: { model: "water-balance", version: "1.0.0", status: "completed" },
  });
  expect(created.status()).toBe(201);

  const listed = await context.request.get(`${API_BASE}/v1/runs`);
  expect(listed.ok()).toBe(true);
  const payload = (await listed.json()) as { items: Array<{ model?: string }>; total: number };
  expect(payload.total).toBeGreaterThanOrEqual(1);
  expect(payload.items.some((item) => item.model === "water-balance")).toBe(true);
});

for (const route of ["/science", "/science/water", "/science/models", "/science/map"]) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("eco.locale", "en");
      window.localStorage.setItem("eco.theme", "light");
    });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
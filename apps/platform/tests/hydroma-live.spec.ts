import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/**
 * Phase 3.91 — LIVE browser → API → Gateway → real HyDroMA → persistence.
 * Requires a running engine and NOJIN_HYDROMA_URL. Skipped otherwise.
 */
test("live irrigation run completes through the real engine", async ({ page, context }) => {
  test.skip(!process.env.NOJIN_HYDROMA_URL, "set NOJIN_HYDROMA_URL to a running HyDroMA engine");
  test.setTimeout(90_000);

  await ensureSignedIn(context);
  await page.goto("/platform/hydroma/irrigation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Seed real agricultural context through the authenticated API.
  const stamp = Date.now();
  const farm = (await (await page.request.post("/api/v1/resources/farms", { data: { name: `Live Farm ${stamp}` } })).json()).id;
  const project = (await (await page.request.post("/api/v1/resources/projects", { data: { name: `Live Project ${stamp}`, farmId: farm } })).json()).id;
  const soil = (await (await page.request.post("/api/v1/soil/profiles", { data: { name: `Live Soil ${stamp}`, source: "measured", farmId: farm, projectId: project, layers: [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }] } })).json()).profile.id;
  await page.request.patch(`/api/v1/soil/profiles/${soil}`, { data: { layers: [{ thickness_mm: 250, theta_fc: 0.32, theta_wp: 0.16 }], source: "estimated" } });
  await page.request.post("/api/v1/soil/observations", { data: { farmId: farm, projectId: project, profileId: soil, parameter: "theta_fc", value: 0.32, unit: "m3_per_m3", source: "lab_measurement", observedAt: new Date().toISOString() } });
  await page.reload();
  await page.getByLabel(/Farm \(context\)/i).selectOption(farm);
  await page.getByLabel(/Project \(context\)/i).selectOption(project);
  await page.getByLabel(/Soil profile/i).selectOption(soil);
  await page.getByRole("combobox", { name: /Version/i }).selectOption("2");

  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/hydroma/irrigation/runs")),
    page.getByRole("button", { name: /اجرای مدل|run model/i }).click(),
  ]);

  // Real persisted result from the engine.
  await expect(page.getByText("net_irrigation_mm").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("COMPLETED").first()).toBeVisible();
  await expect(page.getByText("NOT_VALIDATED").first()).toBeVisible();

  // Engine run id is present and distinct from the API run id.
  const engineRow = page.locator("dt", { hasText: /شناسهٔ اجرای موتور|engine run id/i }).locator("..");
  await expect(engineRow.locator("dd")).not.toHaveText("—");

  // History contains the persisted run.
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  // Duplicate submission is idempotent (same run key, no re-execution).
  await page.getByRole("button", { name: /اجرای مدل|run model/i }).click();
  await expect(page.getByText(/اجرای تکراری|duplicate/i).first()).toBeVisible({ timeout: 10_000 });
});
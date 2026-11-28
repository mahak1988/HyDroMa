import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Phase 3.97 — live dataset assembly + model-input mapping (real API/dev DB). */
test("dataset builder assembles and maps model input", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farm = (await (await page.request.post("/api/v1/resources/farms", { data: { name: `DS Farm ${stamp}` } })).json()).id;
  const csv = ["parameter,unit,value,observed_at", "air_temperature,degC,20,2026-11-01T00:00:00Z", "relative_humidity,percent,50,2026-11-01T00:00:00Z", "wind_speed,m_per_s,2,2026-11-01T00:00:00Z", "solar_radiation,MJ_per_m2_day,20,2026-11-01T00:00:00Z"].join("\n");
  await page.request.post("/api/v1/env/imports", { data: { csv, farmId: farm, source: "imported" } });
  const dataset = (await (await page.request.post("/api/v1/datasets/assemble", { data: { farmId: farm, startDate: "2026-11-01", endDate: "2026-11-01", parameters: ["air_temperature", "relative_humidity", "wind_speed", "solar_radiation"] } })).json()).dataset;
  expect(dataset.readiness).toBe("READY_FOR_MAPPING");

  await page.goto("/platform/hydroma/datasets");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByText("READY_FOR_MAPPING").first()).toBeVisible();
});
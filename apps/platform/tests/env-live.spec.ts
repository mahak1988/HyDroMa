import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Phase 3.95 — live environmental import/quality workflow (real API + dev DB). */
test("environmental CSV import persists observations and quality", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farm = (await (await page.request.post("/api/v1/resources/farms", { data: { name: `Env Farm ${stamp}` } })).json()).id;
  const csv = ["parameter,unit,value,observed_at", `soil_moisture,m3_per_m3,0.24,2026-11-27T0${stamp % 9}:00:00Z`, "air_temperature,degF,68,2026-11-27T00:00:00Z"].join("\n");
  const result = (await (await page.request.post("/api/v1/env/imports", { data: { csv, farmId: farm, source: "imported", filename: "env.csv" } })).json()).import;
  expect(result.imported).toBe(2);

  await page.goto("/platform/hydroma/environment");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByText("soil_moisture").first()).toBeVisible();
  await expect(page.getByText("VALID").first()).toBeVisible();
  await expect(page.getByText("env.csv").first()).toBeVisible();
});
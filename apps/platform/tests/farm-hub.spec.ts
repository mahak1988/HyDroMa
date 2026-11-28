import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Farm Operations hub E2E (fresh server): create farm + irrigation, view hub + timeline. */
test("farm hub shows summary and operational timeline from real data", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farm = `Hub Farm ${stamp}`;

  await page.goto("/platform/agriculture");
  await page.getByRole("button", { name: /افزودن مزرعه|add farm/i }).click();
  await page.getByLabel(/نام|name/i).fill(farm);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(farm).first()).toBeVisible();

  const farms = (await (await page.request.get("/api/v1/resources/farms")).json()).items as any[];
  const id = farms.find((f) => f.name === farm)!.id;
  const orgId = farms[0].organizationId;
  await page.request.post("/api/v1/resources/irrigationEvents", { data: { organizationId: orgId, farmId: String(id), quantity: 12, unit: "mm", method: "drip", occurredAt: "2026-04-10T08:00" } });

  await page.goto(`/platform/agriculture/${id}`);
  await expect(page.getByRole("heading", { name: farm })).toBeVisible();
  await expect(page.getByText(/خلاصهٔ عملیات|operational summary/i).first()).toBeVisible();
  await expect(page.getByText(/گزارش زمانی|timeline/i).first()).toBeVisible();
  // Irrigation event appears in the timeline.
  await expect(page.getByText(/آبیاری|irrigation/i).first()).toBeVisible();
});
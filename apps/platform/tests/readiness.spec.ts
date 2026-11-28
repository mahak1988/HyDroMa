import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Readiness E2E (fresh server): real operational data → READY_FOR_REVIEW; execution not authorized. */
test("hydroma readiness: assess real data, show READY_FOR_REVIEW, no execution", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const orgId = (await (await page.request.get("/api/v1/organizations")).json()).items[0].id;
  const farm = (await (await page.request.post("/api/v1/resources/farms", { data: { organizationId: orgId, name: `RF ${stamp}`, areaHa: 10 } })).json());
  await (await page.request.post("/api/v1/resources/cropCycles", { data: { organizationId: orgId, farmId: String(farm.id), name: `RC ${stamp}`, crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" } })).json();
  await page.request.post("/api/v1/resources/irrigationEvents", { data: { organizationId: orgId, farmId: String(farm.id), quantity: 12, unit: "mm", method: "drip", occurredAt: "2026-04-01T08:00" } });

  await page.goto("/platform/hydroma/readiness");
  await expect(page.getByText(/SCIENTIFIC EXECUTION NOT AUTHORIZED|اجرای علمی مجاز نیست/)).toBeVisible();
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: `RF ${stamp}` });
  await page.getByLabel(/دورهٔ کشت|crop cycle/i).selectOption({ label: `RC ${stamp}` });
  await expect(page.getByText("READY_FOR_REVIEW")).toBeVisible();
});
test("readiness review: save assessment, record review, persist history", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const orgId = (await (await page.request.get("/api/v1/organizations")).json()).items[0].id;
  const farm = (await (await page.request.post("/api/v1/resources/farms", { data: { organizationId: orgId, name: `RR ${stamp}`, areaHa: 10 } })).json());
  await (await page.request.post("/api/v1/resources/cropCycles", { data: { organizationId: orgId, farmId: String(farm.id), name: `RRc ${stamp}`, crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" } })).json();
  await page.request.post("/api/v1/resources/irrigationEvents", { data: { organizationId: orgId, farmId: String(farm.id), quantity: 12, unit: "mm", method: "drip", occurredAt: "2026-04-01T08:00" } });

  await page.goto("/platform/hydroma/readiness");
  await page.getByLabel(/مزرعه|farm/i).selectOption({ label: `RR ${stamp}` });
  await page.getByLabel(/دورهٔ کشت|crop cycle/i).selectOption({ label: `RRc ${stamp}` });
  await expect(page.getByText("READY_FOR_REVIEW")).toBeVisible();
  await page.getByRole("button", { name: /ذخیرهٔ ارزیابی|save assessment/i }).click();
  await page.getByRole("button", { name: /قابل قبول|acceptable/i }).first().click();
  await expect(page.getByText("REVIEWED_ACCEPTABLE").first()).toBeVisible();
  await expect(page.getByText(/SCIENTIFIC EXECUTION NOT AUTHORIZED|اجرای علمی مجاز نیست/)).toBeVisible();
});

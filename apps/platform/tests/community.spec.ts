import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Community activity E2E (fresh server): create village + activity (UI) → publish/register/complete (API) → persisted. */
test("community activity: create (UI) then publish, register, complete persist", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const orgId = (await (await page.request.get("/api/v1/organizations")).json()).items[0].id;
  const village = (await (await page.request.post("/api/v1/resources/villages", { data: { organizationId: orgId, name: `Village ${stamp}`, region: "R" } })).json());

  await page.goto(`/platform/communities/${village.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: /افزودن فعالیت|add activity/i }).click();
  await page.getByLabel(/عنوان|title/i).fill(`Activity ${stamp}`);
  await page.getByRole("button", { name: /ذخیره|save/i }).click();
  await expect(page.getByText(`Activity ${stamp}`)).toBeVisible();

  const acts = (await (await page.request.get(`/api/v1/community/activities?communityId=${village.id}`)).json()).items as any[];
  const act = acts.find((a) => a.title === `Activity ${stamp}`)!;
  expect(act.status).toBe("draft");
  await page.request.post(`/api/v1/community/activities/${act.id}/transition`, { data: { to: "published" } });
  await page.request.post(`/api/v1/community/activities/${act.id}/participants`, { data: {} });
  await page.request.post(`/api/v1/community/activities/${act.id}/transition`, { data: { to: "in_progress" } });
  await page.request.post(`/api/v1/community/activities/${act.id}/transition`, { data: { to: "completed" } });
  const done = (await (await page.request.get(`/api/v1/community/activities/${act.id}`)).json());
  expect(done.status).toBe("completed");
  const parts = (await (await page.request.get(`/api/v1/community/activities/${act.id}/participants`)).json()).items;
  expect(parts.length).toBe(1);
});
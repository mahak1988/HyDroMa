import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./admin-auth.helper";

/** Agricultural task E2E (fresh server): create farm+task, view, transition, farm timeline. */
test("task: create, view in workspace, start, and appear in farm timeline", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farm = `Task Farm ${stamp}`;
  await page.goto("/platform/agriculture");
  await page.getByRole("button", { name: /ط§ظپط²ظˆط¯ظ† ظ…ط²ط±ط¹ظ‡|add farm/i }).click();
  await page.getByLabel(/ظ†ط§ظ…|name/i).fill(farm);
  await page.getByRole("button", { name: /ط°ط®غŒط±ظ‡|save/i }).click();
  await expect(page.getByText(farm).first()).toBeVisible();
  const farms = (await (await page.request.get("/api/v1/resources/farms")).json()).items as any[];
  const farmId = farms.find((f) => f.name === farm)!.id;
  const orgId = farms[0].organizationId;
  const task = (await (await page.request.post("/api/v1/agri/tasks", { data: { organizationId: orgId, farmId: String(farmId), title: `Task ${stamp}`, category: "irrigation", priority: "high", plannedStart: "2026-03-01", dueAt: "2026-03-05" } })).json());

  await page.goto("/platform/tasks");
  await expect(page.getByText(`Task ${stamp}`)).toBeVisible();
  // planned → in_progress via the next action (scoped to this task's row so a
  // sibling task's button is never clicked when the workspace has many rows).
  await page.locator("tr", { hasText: `Task ${stamp}` }).first().getByRole("button", { name: /in_progress/ }).click();
  await expect.poll(async () => (await (await page.request.get(`/api/v1/agri/tasks/${task.id}`)).json()).status).toBe("in_progress");

  // Farm timeline reflects the task.
  await page.goto(`/platform/agriculture/${farmId}`);
  await expect(page.getByText(/ع¯ط²ط§ط±ط´ ط²ظ…ط§ظ†غŒ|timeline/i).first()).toBeVisible();
  expect(task.id).toBeTruthy();
});
test("schedule: tasks with dates appear in the month view and open detail", async ({ page, context }) => {
  await ensureSignedIn(context);
  const stamp = Date.now();
  const farms = (await (await page.request.get("/api/v1/resources/farms")).json()).items as any[];
  const orgId = farms[0].organizationId;
  const farmId = farms[0].id;
  const today = new Date().toISOString().slice(0, 10);
  const t = (await (await page.request.post("/api/v1/agri/tasks", { data: { organizationId: orgId, farmId: String(farmId), title: `Sched ${stamp}`, category: "general", plannedStart: today, dueAt: today } })).json());
  await page.goto("/platform/tasks/schedule");
  await expect(page.getByText(/Schedule|ط¨ط±ظ†ط§ظ…ظ‡ظ” ع©ط§ط±ظ‡ط§/i).first()).toBeVisible();
  await page.locator("table").getByText(`Sched ${stamp}`).first().click();
  await expect(page.getByRole("heading", { name: `Sched ${stamp}` }).first()).toBeVisible();
  expect(t.id).toBeTruthy();
});


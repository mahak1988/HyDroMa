/**
 * Phase 3.69 — agricultural tasks: lifecycle, relationships, assignment, separation.
 * Real service + real SQLite (in-memory). Run: node --test services/api/tests/agri-tasks.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const mk = async (t) => {
  const db = openDatabase(":memory:");
  const s = createServer(createApp({ db }));
  t.after(() => { s.closeAllConnections(); s.close(); });
  s.unref();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${s.address().port}`;
};
async function call(base, path, { method = "GET", body, cookie, expect = 200 } = {}) {
  const r = await fetch(base + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}: ${text.slice(0, 160)}`);
  return { json, headers: r.headers };
}
const ck = (h) => h.get("set-cookie").split(";")[0];
const bootstrap = async (b, e, o) => ck((await call(b, "/v1/auth/register", { method: "POST", body: { email: e, name: e, password: PASS, organizationName: o }, expect: 201 })).headers);
async function invite(b, owner, org, email, role) {
  const inv = (await call(b, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email, role }, expect: 201 })).json;
  const r = await fetch(b + "/v1/auth/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: inv.inviteToken, password: "disposable-pass-1" }) });
  const cookie = r.headers.get("set-cookie").split(";")[0];
  const me = (await call(b, "/v1/auth/me", { cookie })).json;
  return { cookie, id: me.user.id };
}

test("task lifecycle: assigned → in_progress → completed → verified; history recorded", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@task.local", "Task Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F1" }, expect: 201 })).json;
  const cc = (await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), name: "Cycle 1", crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 201 })).json;
  const mgr = await invite(base, owner, org, "mgr@task.local", "manager");

  const task = (await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm.id), cropCycleId: String(cc.id), title: "Plant seedlings", category: "planting", priority: "high", assigneeId: mgr.id, plannedStart: "2026-03-01", dueAt: "2026-03-10" }, expect: 201 })).json;
  assert.equal(task.status, "assigned");
  assert.equal(task.assigneeId, mgr.id);

  await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: mgr.cookie, body: { to: "in_progress" } });
  const done = await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: mgr.cookie, body: { to: "completed", completionNote: "all planted" } });
  assert.equal(done.json.status, "completed");
  assert.ok(done.json.completedAt);
  const verified = await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: owner, body: { to: "verified" } });
  assert.equal(verified.json.status, "verified");
  assert.ok(verified.json.verifiedAt);

  const events = (await call(base, `/v1/agri/tasks/${task.id}/events`, { cookie: owner })).json.items;
  for (const ty of ["created", "assigned", "in_progress", "completed", "verified"]) assert.ok(events.some((e) => e.type === ty), `missing ${ty}`);
});

test("invalid transitions, cross-farm crop cycle, invalid assignee, separation of duties", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own2@task.local", "Task Org 2");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const farm1 = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F1" }, expect: 201 })).json;
  const farm2 = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F2" }, expect: 201 })).json;
  const cc2 = (await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm2.id), name: "C2", crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 201 })).json;

  // Cross-farm crop cycle rejected.
  await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm1.id), cropCycleId: String(cc2.id), title: "Bad", category: "general" }, expect: 422 });
  // Invalid assignee (not a member).
  await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm1.id), title: "BadAssignee", category: "general", assigneeId: "ghost" }, expect: 422 });
  // Invalid category.
  await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm1.id), title: "BadCat", category: "nope" }, expect: 422 });

  const task = (await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm1.id), title: "Task T", category: "general" }, expect: 201 })).json;
  // draft → completed invalid.
  await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: owner, body: { to: "completed" }, expect: 409 });
  // Complete then self-verify blocked (separation).
  await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: owner, body: { to: "planned" } });
  await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: owner, body: { to: "in_progress" } });
  await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: owner, body: { to: "completed" } });
  await call(base, `/v1/agri/tasks/${task.id}/transition`, { method: "POST", cookie: owner, body: { to: "verified" }, expect: 403 });
});

test("assignment: change assignee (audited), reject invalid, filter mine/unassigned", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own-asg@task.local", "Asg Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "AF" }, expect: 201 })).json;
  const m1 = await invite(base, owner, org, "a1@asg.local", "manager");
  const task = (await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm.id), title: "Assignable", category: "general" }, expect: 201 })).json;
  // Assign → status assigned.
  const assigned = await call(base, `/v1/agri/tasks/${task.id}`, { method: "PATCH", cookie: owner, body: { assigneeId: m1.id } });
  assert.equal(assigned.json.assigneeId, m1.id);
  assert.equal(assigned.json.status, "assigned");
  // Invalid assignee rejected.
  await call(base, `/v1/agri/tasks/${task.id}`, { method: "PATCH", cookie: owner, body: { assigneeId: "ghost" }, expect: 422 });
  // Filters.
  const mine = (await call(base, `/v1/agri/tasks?assigneeId=__me__`, { cookie: m1.cookie })).json;
  assert.equal(mine.total, 1);
  const unassigned = (await call(base, `/v1/agri/tasks?assigneeId=__none__`, { cookie: owner })).json;
  assert.equal(unassigned.total, 0);
  // History has assigned event.
  const events = (await call(base, `/v1/agri/tasks/${task.id}/events`, { cookie: owner })).json.items;
  assert.ok(events.some((e) => e.type === "assigned"));
});

test("pagination, search, date range, timeline and member names", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own-pg@task.local", "Pg Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "PF" }, expect: 201 })).json;
  const m = await invite(base, owner, org, "mem@pg.local", "manager");
  for (const [i, title] of ["Alpha", "Beta", "Gamma"].entries()) {
    await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm.id), title, category: "general", dueAt: "2026-05-0" + (i + 1), assigneeId: m.id }, expect: 201 });
  }
  // Pagination: limit 2 → total 3, nextCursor, page 2 has 1.
  const p1 = (await call(base, "/v1/agri/tasks?limit=2", { cookie: owner })).json;
  assert.equal(p1.total, 3); assert.equal(p1.items.length, 2); assert.ok(p1.nextCursor);
  const p2 = (await call(base, `/v1/agri/tasks?limit=2&cursor=${encodeURIComponent(p1.nextCursor)}`, { cookie: owner })).json;
  assert.equal(p2.items.length, 1); assert.equal(p2.nextCursor, null);
  // Search.
  const s = (await call(base, "/v1/agri/tasks?q=Beta", { cookie: owner })).json;
  assert.equal(s.total, 1);
  // Date range.
  const dr = (await call(base, "/v1/agri/tasks?dueFrom=2026-05-02&dueTo=2026-05-02", { cookie: owner })).json;
  assert.equal(dr.total, 1);
  // Member name exposed.
  const members = (await call(base, `/v1/organizations/${org}/members`, { cookie: owner })).json;
  assert.ok(members.items.some((x) => x.user?.name), "member user name present");
  // Timeline endpoint (farm-scoped, sorted desc, paginated).
  const tl = (await call(base, `/v1/agri/farms/${farm.id}/timeline?limit=2`, { cookie: owner })).json;
  assert.equal(tl.total, 3); assert.equal(tl.items.length, 2); assert.ok(tl.nextCursor);
  const dates = tl.items.map((e) => e.date); assert.deepEqual([...dates].sort().reverse(), dates);
  const onlyTasks = (await call(base, `/v1/agri/farms/${farm.id}/timeline?type=task`, { cookie: owner })).json;
  assert.ok(onlyTasks.items.every((e) => e.type === "task"));
});

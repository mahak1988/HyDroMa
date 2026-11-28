/**
 * Phase 3.73 — agricultural operations intelligence aggregation. Real service + SQLite.
 * Run: node --test services/api/tests/intelligence.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const mk = async (t) => { const db = openDatabase(":memory:"); const s = createServer(createApp({ db })); t.after(() => { s.closeAllConnections(); s.close(); }); s.unref(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); return `http://127.0.0.1:${s.address().port}`; };
async function call(b, p, { method = "GET", body, cookie, expect = 200 } = {}) { const r = await fetch(b + p, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined }); const text = await r.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; } assert.equal(r.status, expect, `${method} ${p} -> ${r.status}: ${text.slice(0, 120)}`); return { json, headers: r.headers }; }
const ck = (h) => h.get("set-cookie").split(";")[0];
const bootstrap = async (b, e, o) => ck((await call(b, "/v1/auth/register", { method: "POST", body: { email: e, name: e, password: PASS, organizationName: o }, expect: 201 })).headers);
const past = "2020-01-01";
const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

test("intelligence metrics + priorities reflect persisted data; tenant-isolated", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@intel.local", "Intel Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F1" }, expect: 201 })).json;
  await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), name: "C1", crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 201 });
  await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm.id), title: "Overdue", category: "general", dueAt: past }, expect: 201 });
  await call(base, "/v1/agri/tasks", { method: "POST", cookie: owner, body: { farmId: String(farm.id), title: "Soon", category: "general", dueAt: soon }, expect: 201 });

  const intel = (await call(base, "/v1/agri/intelligence", { cookie: owner })).json;
  assert.equal(intel.metrics.farms, 1);
  assert.ok(intel.metrics.activeCropCycles + intel.metrics.plannedCropCycles + intel.metrics.completedCropCycles >= 1, "crop cycle counted");
  assert.ok(intel.metrics.overdueTasks >= 1, "overdue counted");
  assert.ok(intel.metrics.dueSoonTasks >= 1, "due soon counted");
  assert.ok(intel.metrics.unassignedTasks >= 1, "unassigned counted");
  assert.ok(intel.priorities.some((p) => p.reason === "overdue"), "overdue priority present");

  // Tenant isolation: a foreign org sees zero farms.
  const b = await bootstrap(base, "b@intel.local", "Other Org");
  const other = (await call(base, "/v1/agri/intelligence", { cookie: b })).json;
  assert.equal(other.metrics.farms, 0);
  assert.equal(other.metrics.overdueTasks, 0);
});

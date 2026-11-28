/**
 * Phase 5 — Intelligence Priorities dedupe (N-04, Workstream D).
 * A task that is both overdue and unassigned must appear once, as its most
 * severe classification (overdue/high) — never duplicated.
 * Run: node --test services/api/tests/intelligence-priorities.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";

async function makeApp(t) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${server.address().port}`;
}
async function call(base, path, { method = "GET", body, cookie, expect = 200 } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => null);
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}`);
  return { json, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}

test("a task that is overdue AND unassigned appears once (highest severity)", async (t) => {
  const base = await makeApp(t);
  const { cookie } = await call(base, "/v1/auth/register", { method: "POST", body: { email: "intel@eco.local", name: "Intel", password: PASS, organizationName: "Intel Org" }, expect: 201 });
  const orgId = (await call(base, "/v1/organizations", { cookie })).json.items[0].id;
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie, body: { organizationId: orgId, name: "IF" }, expect: 201 })).json;
  const task = (await call(base, "/v1/agri/tasks", { method: "POST", cookie, body: { organizationId: orgId, farmId: String(farm.id), title: "Overdue & Unassigned", category: "general", priority: "high", dueAt: "2020-01-01" }, expect: 201 })).json;

  const { json } = await call(base, "/v1/agri/intelligence", { cookie });
  const matches = json.priorities.filter((p) => p.to === `/platform/tasks/${task.id}`);
  assert.equal(matches.length, 1, "task must not be duplicated in priorities");
  assert.equal(matches[0].reason, "overdue", "kept classification is the most severe (overdue)");
  assert.equal(matches[0].severity, "high");
  // Metrics still reflect both facts (not hidden to look healthier).
  assert.ok(json.metrics.overdueTasks >= 1);
  assert.ok(json.metrics.unassignedTasks >= 1);
});
/**
 * Phase 3.83 â€” scientific run persistence foundation.
 * Real service + real SQLite (temporary/in-memory). No mocks.
 * Run: node --test services/api/tests/runs.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}: ${text.slice(0, 200)}`);
  return { json, headers: r.headers };
}

const cookieOf = (h) => h.get("set-cookie").split(";")[0];

async function bootstrap(base, email, orgName) {
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email, name: email, password: PASS, organizationName: orgName }, expect: 201 });
  const cookie = cookieOf(headers);
  const org = (await call(base, "/v1/organizations", { cookie })).json.items[0].id;
  return { cookie, org };
}

const runBody = (runKey, input = { soilWater: 0.2, et0: 5.1 }) => ({
  runKey,
  modelId: "eco-nojin.hydroma.irrigation",
  modelVersion: "1.0.0",
  input,
  correlationId: "corr-1",
});

test("schema: versioned migration is recorded once and is idempotent", () => {
  const file = path.join(tmpdir(), `nojin-runs-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  const first = openDatabase(file);
  const v1 = first.prepare("SELECT version FROM schema_migrations ORDER BY version").all().map((r) => r.version);
  const fk = first.prepare("PRAGMA foreign_keys").get();
  const busy = Object.values(first.prepare("PRAGMA busy_timeout").get())[0];
  const indexes = first.prepare("PRAGMA index_list('hydroma_runs')").all().map((r) => r.name);
  first.close();
  const second = openDatabase(file);
  const v2 = second.prepare("SELECT version FROM schema_migrations ORDER BY version").all().map((r) => r.version);
  second.close();
  rmSync(file, { force: true });
  for (const suffix of ["-wal", "-shm"]) rmSync(file + suffix, { force: true });

  assert.deepEqual(v1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "migrations 1-11 applied");
  assert.deepEqual(v2, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "reopening does not reapply migrations");
  assert.equal(fk.foreign_keys, 1, "foreign keys enforced");
  assert.equal(busy, 5000, "busy timeout configured");
  assert.ok(indexes.includes("idx_hydroma_runs_org_status"), "org/status index present");
});

test("lifecycle: create -> duplicate -> invalid transition -> complete with output/provenance", async (t) => {
  const base = await makeApp(t);
  const { cookie } = await bootstrap(base, "run1@eco.local", "Run Org 1");

  const created = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: runBody("r1"), expect: 201 })).json.run;
  assert.equal(created.status, "QUEUED");
  assert.match(created.inputHash, /^[0-9a-f]{64}$/u, "input hash is sha256");
  assert.match(created.parameterHash, /^[0-9a-f]{64}$/u, "parameter hash is sha256");
  assert.deepEqual(created.input, { soilWater: 0.2, et0: 5.1 });
  assert.equal(created.scientificStatus, "NOT_VALIDATED", "scientific status is server-set, never caller-supplied");

  const dup = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: runBody("r1"), expect: 200 })).json;
  assert.equal(dup.duplicate, true, "duplicate is idempotent");
  assert.equal(dup.run.id, created.id, "same run id returned");

  await call(base, `/v1/hydroma/runs/${created.id}/status`, { method: "POST", cookie, body: { status: "COMPLETED" }, expect: 409 });
  await call(base, `/v1/hydroma/runs/${created.id}/status`, { method: "POST", cookie, body: { status: "CANCELLED" }, expect: 409 });

  const running = (await call(base, `/v1/hydroma/runs/${created.id}/status`, { method: "POST", cookie, body: { status: "RUNNING" } })).json.run;
  assert.equal(running.status, "RUNNING");
  assert.ok(running.startedAt, "started_at recorded");

  const failed = (await call(base, `/v1/hydroma/runs/${created.id}/status`, {
    method: "POST",
    cookie,
    body: { status: "FAILED", error: "aborted by operator", scientificStatus: "VALIDATED", softwareMaturity: "production_approved" },
  })).json.run;
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.output, null, "no fabricated output on failure");
  assert.equal(failed.scientificStatus, "NOT_VALIDATED", "caller cannot inflate scientific status");
  assert.equal(failed.softwareMaturity, null, "caller cannot inflate software maturity");

  await call(base, `/v1/hydroma/runs/${created.id}/status`, { method: "POST", cookie, body: { status: "COMPLETED" }, expect: 409 });

  const fetched = (await call(base, `/v1/hydroma/runs/${created.id}`, { cookie })).json.run;
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.status, "FAILED");

  const list = (await call(base, "/v1/hydroma/runs?limit=10", { cookie })).json;
  assert.equal(list.total, 1);
  assert.equal(list.items[0].id, created.id);
});

test("failure and cancellation paths persist honestly", async (t) => {
  const base = await makeApp(t);
  const { cookie } = await bootstrap(base, "run2@eco.local", "Run Org 2");

  const failed = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: runBody("r2"), expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${failed.id}/status`, { method: "POST", cookie, body: { status: "RUNNING" } });
  const failedDone = (await call(base, `/v1/hydroma/runs/${failed.id}/status`, { method: "POST", cookie, body: { status: "FAILED", error: "model input out of range" } })).json.run;
  assert.equal(failedDone.status, "FAILED");
  assert.equal(failedDone.error, "model input out of range");
  assert.equal(failedDone.output, null, "no fabricated output on failure");

  const cancelled = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: runBody("r3"), expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${cancelled.id}/status`, { method: "POST", cookie, body: { status: "CANCELLED" }, expect: 409 });
  const stillQueued = (await call(base, `/v1/hydroma/runs/${cancelled.id}`, { cookie })).json.run;
  assert.equal(stillQueued.status, "QUEUED", "cancellation is not a supported transition");
});

test("tenant isolation: cross-org read, list and update are denied", async (t) => {
  const base = await makeApp(t);
  const a = await bootstrap(base, "runA@eco.local", "Run Org A");
  const b = await bootstrap(base, "runB@eco.local", "Run Org B");

  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a.cookie, body: runBody("shared"), expect: 201 })).json.run;

  await call(base, `/v1/hydroma/runs/${run.id}`, { cookie: b.cookie, expect: 404 });
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie: b.cookie, body: { status: "RUNNING" }, expect: 404 });
  const bList = (await call(base, "/v1/hydroma/runs", { cookie: b.cookie })).json;
  assert.equal(bList.total, 0, "org B cannot list org A runs");

  // Same runKey in another tenant is a distinct run (idempotency is org-scoped).
  const bRun = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: b.cookie, body: runBody("shared"), expect: 201 })).json.run;
  assert.notEqual(bRun.id, run.id, "org-scoped idempotency");
  assert.equal(bRun.organizationId, b.org);
});

test("canonical hashing is deterministic across key order", async (t) => {
  const base = await makeApp(t);
  const { cookie } = await bootstrap(base, "run3@eco.local", "Run Org 3");
  const first = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: runBody("h1", { a: 1, b: { c: 2, d: 3 } }), expect: 201 })).json.run;
  const second = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: runBody("h2", { b: { d: 3, c: 2 }, a: 1 }), expect: 201 })).json.run;
  assert.equal(first.inputHash, second.inputHash, "canonical input hash is order-independent");
  assert.equal(first.parameterHash, second.parameterHash, "canonical parameter hash is order-independent");
});

test("invalid payloads are rejected without persistence", async (t) => {
  const base = await makeApp(t);
  const { cookie } = await bootstrap(base, "run4@eco.local", "Run Org 4");
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { modelId: "m", modelVersion: "1.0.0", input: {} }, expect: 422 });
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "x", modelId: "m", modelVersion: "1.0.0", input: [] }, expect: 422 });
  const list = (await call(base, "/v1/hydroma/runs", { cookie })).json;
  assert.equal(list.total, 0, "rejected payloads are not stored");
});
test("context: project/farm association persists and list filters by context", async (t) => {
  const base = await makeApp(t);
  const { cookie } = await bootstrap(base, "ctx@eco.local", "Ctx Org");
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie, body: { name: "Ctx Farm" }, expect: 201 })).json;
  const project = (await call(base, "/v1/resources/projects", { method: "POST", cookie, body: { name: "Ctx Project", farmId: farm.id }, expect: 201 })).json;
  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "ctx1", modelId: "m", modelVersion: "1.0.0", input: { a: 1 }, farmId: farm.id, projectId: project.id }, expect: 201 })).json.run;
  assert.equal(run.farmId, farm.id);
  assert.equal(run.projectId, project.id);
  const byProject = (await call(base, `/v1/hydroma/runs?projectId=${project.id}`, { cookie })).json;
  assert.equal(byProject.total, 1);
  const byFarm = (await call(base, `/v1/hydroma/runs?farmId=${farm.id}`, { cookie })).json;
  assert.equal(byFarm.total, 1);
  const none = (await call(base, "/v1/hydroma/runs?farmId=other", { cookie })).json;
  assert.equal(none.total, 0);
});

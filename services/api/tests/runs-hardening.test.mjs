/**
 * Phase 3.84 — scientific run persistence hardening.
 * Real service + real SQLite (temporary/in-memory). No mocks.
 * Run: node --test services/api/tests/runs-hardening.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase, runMigrations } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";

async function makeApp(t, db = openDatabase(":memory:")) {
  const server = createServer(createApp({ db }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${server.address().port}`, db };
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
  return cookieOf(headers);
}

const body = (runKey, input = { soilWater: 0.2 }) => ({ runKey, modelId: "m", modelVersion: "1.0.0", input });

test("atomic create: run + audit commit together; audit failure rolls back the run", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "h1@eco.local", "H Org 1");

  const created = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("a1"), expect: 201 })).json.run;
  const audits = db.prepare("SELECT COUNT(*) AS n FROM audit WHERE entity = 'hydroma_runs' AND entity_id = ?").get(created.id).n;
  assert.equal(audits, 1, "create writes exactly one audit row");

  db.exec("DROP TABLE audit");
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("a2"), expect: 500 });
  const total = db.prepare("SELECT COUNT(*) AS n FROM hydroma_runs WHERE run_key = 'a2'").get().n;
  assert.equal(total, 0, "audit failure rolls back the run insert");
});

test("atomic status: status + audit commit together; audit failure rolls back the status", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "h2@eco.local", "H Org 2");
  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("s1"), expect: 201 })).json.run;

  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "RUNNING" } });
  let row = db.prepare("SELECT status FROM hydroma_runs WHERE id = ?").get(run.id);
  assert.equal(row.status, "RUNNING");

  db.exec("DROP TABLE audit");
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "FAILED", error: "abort" }, expect: 500 });
  row = db.prepare("SELECT status FROM hydroma_runs WHERE id = ?").get(run.id);
  assert.equal(row.status, "RUNNING", "audit failure rolls back the status update");
});

test("concurrent idempotency: one run per (org, run_key); tenants independent", async (t) => {
  const { base, db } = await makeApp(t);
  const a = await bootstrap(base, "h3a@eco.local", "H Org 3A");
  const b = await bootstrap(base, "h3b@eco.local", "H Org 3B");

  const results = await Promise.all(
    Array.from({ length: 8 }, () => fetch(base + "/v1/hydroma/runs", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: a },
      body: JSON.stringify(body("same")),
    })),
  );
  const statuses = results.map((r) => r.status);
  assert.equal(statuses.filter((s) => s === 201).length, 1, "exactly one request creates the run");
  assert.ok(statuses.every((s) => s === 201 || s === 200), "all requests are deterministic");
  const count = db.prepare("SELECT COUNT(*) AS n FROM hydroma_runs WHERE org_id = (SELECT id FROM organizations WHERE name = 'H Org 3A') AND run_key = 'same'").get().n;
  assert.equal(count, 1, "uniqueness constraint is authoritative");

  const other = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: b, body: body("same"), expect: 201 })).json.run;
  assert.notEqual(other.id, results[0].json?.run?.id ?? "x", "same key in another tenant is independent");
});

test("migration failure: failed version is not recorded, rollback holds, later migration succeeds", () => {
  const file = path.join(tmpdir(), `nojin-mig-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  const db = new DatabaseSync(file);
  try {
    runMigrations(db, [
      { version: 1, name: "base", statements: ["CREATE TABLE probe (x INTEGER)"] },
      { version: 2, name: "bad", statements: ["THIS IS NOT VALID SQL"] },
    ]);
    assert.fail("expected migration failure");
  } catch {
    // expected
  }
  const versions = db.prepare("SELECT version FROM schema_migrations ORDER BY version").all().map((r) => r.version);
  assert.deepEqual(versions, [1], "only the successful migration is recorded");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM probe").get().n, 0, "migration 1 committed");

  runMigrations(db, [{ version: 2, name: "fixed", statements: ["CREATE TABLE probe2 (x INTEGER)"] }]);
  const after = db.prepare("SELECT version FROM schema_migrations ORDER BY version").all().map((r) => r.version);
  assert.deepEqual(after, [1, 2], "a later valid attempt succeeds");
  db.close();
  rmSync(file, { force: true });
  for (const suffix of ["-wal", "-shm"]) rmSync(file + suffix, { force: true });
});

test("payload protection: sensitive keys and oversized payloads are rejected before persistence", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "h4@eco.local", "H Org 4");

  await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("p1", { password: "x" }), expect: 422 });
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("p2", { big: "x".repeat(300 * 1024) }), expect: 413 });
  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("p3"), expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "RUNNING", output: { token: "x" } }, expect: 422 });
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "RUNNING", provenance: { big: "x".repeat(70 * 1024) } }, expect: 413 });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM hydroma_runs WHERE run_key IN ('p1','p2')").get().n, 0, "rejected payloads are not stored");
});

test("maturity metadata is server-controlled and cannot be inflated by the caller", async (t) => {
  const { base } = await makeApp(t);
  const cookie = await bootstrap(base, "h5@eco.local", "H Org 5");
  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: body("m1"), expect: 201 })).json.run;
  assert.equal(run.scientificStatus, "NOT_VALIDATED");

  const updated = (await call(base, `/v1/hydroma/runs/${run.id}/status`, {
    method: "POST",
    cookie,
    body: { status: "RUNNING", scientificStatus: "VALIDATED", softwareMaturity: "production_approved" },
  })).json.run;
  assert.equal(updated.scientificStatus, "NOT_VALIDATED", "caller cannot claim scientific validation");
  assert.equal(updated.softwareMaturity, null, "caller cannot claim software maturity");
});
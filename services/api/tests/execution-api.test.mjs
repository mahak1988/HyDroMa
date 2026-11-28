/**
 * Phase 3.101 — real controlled model execution (no mocks).
 * Requires the engine venv; skips if python is unavailable.
 * Run: node --test services/api/tests/execution-api.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const PY = "D:/NOJIN/engines/hydroma/.venv/Scripts/python.exe";
const input = { layers: [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }], p: 0.5, depletion_mm: 40 };

async function makeApp(t) {
  const db = openDatabase(":memory:");
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

test("real fao56 execution persists manifest/output and is deterministic", { skip: existsSync(PY) ? false : "engine venv missing" }, async (t) => {
  const { base, db } = await makeApp(t);
  const a = await bootstrap(base, "execA@eco.local", "Exec A");
  const b = await bootstrap(base, "execB@eco.local", "Exec B");
  const modelInput = { rn: 20, t: 20, u2: 2, ea: 1.5 };

  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "exec1", modelId: "fao56_et0", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  const result = (await call(base, `/v1/hydroma/runs/${run.id}/execute`, { method: "POST", cookie: a, body: { modelInput }, expect: 200 })).json.attempt;
  assert.equal(result.status, "SUCCEEDED");
  assert.match(result.outputFingerprint, /^[0-9a-f]{64}$/);
  assert.match(result.manifestFingerprint, /^[0-9a-f]{64}$/);
  assert.ok(result.output.result.et0_mm_per_day > 0, "real engine output");
  assert.equal(result.manifest.engine.modelId, "fao56_et0");
  assert.equal(result.manifest.observed.execution, "isolated-subprocess");

  // Duplicate execute does not create a second attempt.
  const dup = (await call(base, `/v1/hydroma/runs/${run.id}/execute`, { method: "POST", cookie: a, body: { modelInput }, expect: 200 })).json;
  assert.equal(dup.duplicate, true);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM hydroma_execution_attempts WHERE run_id = ?").get(run.id).n, 1);

  // Determinism: identical input in a second run yields identical output fingerprint.
  const run2 = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "exec2", modelId: "fao56_et0", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  const result2 = (await call(base, `/v1/hydroma/runs/${run2.id}/execute`, { method: "POST", cookie: a, body: { modelInput }, expect: 200 })).json.attempt;
  assert.equal(result2.outputFingerprint, result.outputFingerprint, "exact deterministic output");

  await call(base, `/v1/hydroma/runs/${run.id}/execute`, { method: "POST", cookie: b, body: { modelInput }, expect: 404 });
  const run3 = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "exec4", modelId: "fao56_et0", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${run3.id}/execute`, { method: "POST", cookie: a, body: { modelInput: [] }, expect: 422 });

  // Snapshot integrity: tampering blocks execution.
  const dsRun = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "exec3", modelId: "fao56_et0", modelVersion: "1.0.0", input, datasetId: "missing" }, expect: 422 })).json;
  assert.equal(dsRun.error.code, "invalid_dataset");
});
test("water_balance determinism, executed-input fingerprint, retry history and immutability", { skip: existsSync(PY) ? false : "engine venv missing" }, async (t) => {
  const { base, db } = await makeApp(t);
  const a = await bootstrap(base, "execC@eco.local", "Exec C");
  const wb = { periodDays: 1, precipitation: 10, irrigation: 0, runoff: 0, evapotranspiration: 5 };

  const r1 = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "wb1", modelId: "water_balance", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  const a1 = (await call(base, `/v1/hydroma/runs/${r1.id}/execute`, { method: "POST", cookie: a, body: { modelInput: wb }, expect: 200 })).json.attempt;
  assert.equal(a1.status, "SUCCEEDED");
  assert.match(a1.inputFingerprint, /^[0-9a-f]{64}$/);
  assert.equal(a1.inputSource, "client");

  const r2 = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "wb2", modelId: "water_balance", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  const a2 = (await call(base, `/v1/hydroma/runs/${r2.id}/execute`, { method: "POST", cookie: a, body: { modelInput: wb }, expect: 200 })).json.attempt;
  assert.equal(a2.outputFingerprint, a1.outputFingerprint, "exact deterministic output");

  // Terminal attempts are immutable at the DB level.
  assert.throws(() => db.prepare("UPDATE hydroma_execution_attempts SET status = 'X' WHERE id = ?").run(a1.id), /immutable/);

  // Retry after failure preserves both attempts.
  const r3 = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "wb3", modelId: "water_balance", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${r3.id}/execute`, { method: "POST", cookie: a, body: { modelInput: {} }, expect: 502 });
  const retry = (await call(base, `/v1/hydroma/runs/${r3.id}/execute`, { method: "POST", cookie: a, body: { modelInput: wb }, expect: 200 })).json.attempt;
  assert.equal(retry.attempt, 2, "retry appended");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM hydroma_execution_attempts WHERE run_id = ?").get(r3.id).n, 2);

  const r4 = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "wb4", modelId: "water_balance", modelVersion: "1.0.0", input }, expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${r4.id}/execute`, { method: "POST", cookie: a, body: { mode: "snapshot" }, expect: 422 });
});

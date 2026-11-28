/**
 * Phase 3.89 — REAL engine end-to-end verification (opt-in).
 * Requires a running HyDroMA engine and NOJIN_HYDROMA_URL.
 * Run: NOJIN_HYDROMA_URL=http://127.0.0.1:8001 node --test services/api/tests/engine-real.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const input = () => ({ layers: [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }], p: 0.5, depletion_mm: 40 });

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
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}: ${text.slice(0, 300)}`);
  return { json, headers: r.headers };
}

const cookieOf = (h) => h.get("set-cookie").split(";")[0];
async function bootstrap(base, email, orgName) {
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email, name: email, password: PASS, organizationName: orgName }, expect: 201 });
  return cookieOf(headers);
}

test("REAL engine: API -> Gateway -> HyDroMA -> persistence", { skip: process.env.NOJIN_HYDROMA_URL ? false : "set NOJIN_HYDROMA_URL" }, async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "real@eco.local", "Real Org");

  const created = (await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "real-1", input: input(), correlationId: "corr-real" }, expect: 200 })).json.run;
  assert.equal(created.status, "COMPLETED");
  assert.equal(created.modelId, "eco-nojin.hydroma.irrigation-schedule");
  assert.equal(created.modelVersion, "1.0.0");
  assert.ok(created.output && created.output.result, "real engine result present");
  assert.equal(typeof created.output.result.net_irrigation_mm, "number");
  assert.equal(created.units.net_irrigation_mm, "mm");
  assert.ok(created.engineRunId, "engine run id persisted");
  assert.notEqual(created.engineRunId, created.id, "api and engine ids distinct");
  assert.equal(created.scientificStatus, "NOT_VALIDATED");
  assert.equal(created.softwareMaturity, null);
  assert.equal(created.correlationId, "corr-real");
  assert.ok(created.provenance, "provenance persisted");

  const duplicate = (await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "real-1", input: input() }, expect: 200 })).json;
  assert.equal(duplicate.duplicate, true);

  const row = db.prepare("SELECT status, attempts FROM hydroma_runs WHERE id = ?").get(created.id);
  assert.equal(row.status, "COMPLETED");
  assert.equal(row.attempts, 1);
});
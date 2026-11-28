/**
 * Phase 3.74 — HyDroMA integration READINESS (no execution). Real service + SQLite.
 * Run: node --test services/api/tests/readiness.test.mjs
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

async function seed(base, owner, org, { areaHa = 10, unit = "mm", inSeason = true } = {}) {
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F", areaHa }, expect: 201 })).json;
  const cc = (await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), name: "C", crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 201 })).json;
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), quantity: 12, unit, method: "drip", occurredAt: inSeason ? "2026-04-01T08:00" : "2025-01-01T08:00" }, expect: 201 });
  return { farm, cc };
}

test("readiness: READY_FOR_REVIEW when contract inputs present and valid", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@rdy.local", "Rdy Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const { farm, cc } = await seed(base, owner, org);
  const r = (await call(base, `/v1/hydroma/readiness?farmId=${farm.id}&cropCycleId=${cc.id}`, { cookie: owner })).json;
  assert.equal(r.state, "READY_FOR_REVIEW");
  assert.ok(r.available.includes("areaHa"));
  assert.ok(r.available.includes("irrigationRecords"));
  assert.equal(r.unitMismatches.length, 0);
  assert.ok(r.sources.length >= 2);
  assert.ok(r.contractId && r.contractVersion);
});

test("readiness: NOT_READY on missing crop cycle, unit mismatch, temporal, cross-tenant", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own2@rdy.local", "Rdy Org 2");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  // Missing crop cycle.
  const { farm, cc } = await seed(base, owner, org);
  const miss = (await call(base, `/v1/hydroma/readiness?farmId=${farm.id}`, { cookie: owner })).json;
  assert.equal(miss.state, "NOT_READY"); assert.ok(miss.missing.includes("cropCycleId"));
  // Unit mismatch + out-of-season.
  const { farm: f2, cc: c2 } = await seed(base, owner, org, { unit: "m3", inSeason: false });
  const bad = (await call(base, `/v1/hydroma/readiness?farmId=${f2.id}&cropCycleId=${c2.id}`, { cookie: owner })).json;
  assert.equal(bad.state, "NOT_READY");
  assert.ok(bad.unitMismatches.length >= 1);
  assert.ok(bad.temporalIssues.length >= 1);
  // Cross-tenant: a foreign org cannot assess this farm (farm not found → NOT_READY, no leak).
  const b = await bootstrap(base, "b@rdy.local", "Other");
  const foreign = (await call(base, `/v1/hydroma/readiness?farmId=${farm.id}&cropCycleId=${cc.id}`, { cookie: b })).json;
  assert.equal(foreign.state, "NOT_READY"); assert.ok(foreign.missing.includes("farm"));
});
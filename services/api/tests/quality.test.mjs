/**
 * Phase 3.76 — data quality & provenance findings. Real service + SQLite.
 * Run: node --test services/api/tests/quality.test.mjs
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

test("quality findings: unit conflict, duplicate, provenance, spatial; deterministic + snapshot", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@q.local", "Q Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F", areaHa: 10 }, expect: 201 })).json;
  const cc = (await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), name: "C", crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 201 })).json;
  // Duplicate irrigation (same occurredAt+quantity) + a unit conflict.
  const irr = (unit) => call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), quantity: 12, unit, method: "drip", occurredAt: "2026-04-01T08:00" }, expect: 201 });
  await irr("mm"); await irr("mm"); await irr("m3");

  const r = (await call(base, `/v1/hydroma/readiness?farmId=${farm.id}&cropCycleId=${cc.id}`, { cookie: owner })).json;
  assert.ok(r.findings.some((f) => f.category === "unit"), "unit finding");
  assert.ok(r.findings.some((f) => f.category === "consistency"), "duplicate finding");
  assert.ok(r.findings.every((f) => f.rulesVersion), "findings versioned");
  assert.equal(r.spatial, "unavailable");
  assert.ok(["available", "incomplete"].includes(r.provenance));
  // Snapshot preserves findings (assessments endpoint).
  const a = (await call(base, "/v1/hydroma/readiness/assessments", { method: "POST", cookie: owner, body: { farmId: String(farm.id), cropCycleId: String(cc.id) }, expect: 201 })).json;
  const got = (await call(base, `/v1/hydroma/readiness/assessments/${a.id}`, { cookie: owner })).json;
  assert.ok(got.snapshot.findings.length >= 2, "snapshot retains findings");
  assert.equal(got.currentness, "current", "fingerprint stable for unchanged inputs");
});
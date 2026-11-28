/**
 * Phase 3.75 — persistent readiness assessments + review + staleness. Real service + SQLite.
 * Run: node --test services/api/tests/readiness-review.test.mjs
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
async function invite(b, owner, org, email, role) { const inv = (await call(b, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email, role }, expect: 201 })).json; const r = await fetch(b + "/v1/auth/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: inv.inviteToken, password: "disposable-pass-1" }) }); const cookie = r.headers.get("set-cookie").split(";")[0]; const me = (await call(b, "/v1/auth/me", { cookie })).json; return { cookie, id: me.user.id }; }

async function seed(b, owner, org) {
  const farm = (await call(b, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "F", areaHa: 10 }, expect: 201 })).json;
  const cc = (await call(b, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), name: "C", crop: "wheat", areaHa: 5, status: "active", seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 201 })).json;
  await call(b, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), quantity: 12, unit: "mm", method: "drip", occurredAt: "2026-04-01T08:00" }, expect: 201 });
  return { farm, cc };
}

test("assessment persists, reviews append-only, staleness detected, immutable, isolated", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@rr.local", "RR Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const { farm, cc } = await seed(base, owner, org);

  const a = (await call(base, "/v1/hydroma/readiness/assessments", { method: "POST", cookie: owner, body: { farmId: String(farm.id), cropCycleId: String(cc.id) }, expect: 201 })).json;
  assert.equal(a.state, "READY_FOR_REVIEW");
  assert.equal(a.reviewState, "ASSESSMENT_CREATED");
  assert.ok(a.fingerprint);

  const list = (await call(base, "/v1/hydroma/readiness/assessments", { cookie: owner })).json;
  assert.equal(list.total, 1);
  const got = (await call(base, `/v1/hydroma/readiness/assessments/${a.id}`, { cookie: owner })).json;
  assert.equal(got.currentness, "current");

  // Unauthorized review (member).
  const m = await invite(base, owner, org, "m@rr.local", "member");
  await call(base, `/v1/hydroma/readiness/assessments/${a.id}/review`, { method: "POST", cookie: m.cookie, body: { decision: "acceptable" }, expect: 403 });

  // Authorized review (owner) → REVIEWED_ACCEPTABLE; snapshot state immutable.
  const rev = await call(base, `/v1/hydroma/readiness/assessments/${a.id}/review`, { method: "POST", cookie: owner, body: { decision: "acceptable", note: "ok" } });
  assert.equal(rev.json.reviewState, "REVIEWED_ACCEPTABLE");
  assert.equal(rev.json.state, "READY_FOR_REVIEW", "assessment state immutable");
  const reviews = (await call(base, `/v1/hydroma/readiness/assessments/${a.id}/reviews`, { cookie: owner })).json.items;
  assert.equal(reviews.length, 1);
  // Repeated review is a no-op (still one review).
  await call(base, `/v1/hydroma/readiness/assessments/${a.id}/review`, { method: "POST", cookie: owner, body: { decision: "findings" } });
  assert.equal((await call(base, `/v1/hydroma/readiness/assessments/${a.id}/reviews`, { cookie: owner })).json.items.length, 1);

  // Staleness: add an irrigation record → fingerprint changes.
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: String(farm.id), quantity: 5, unit: "mm", method: "drip", occurredAt: "2026-05-01T08:00" }, expect: 201 });
  const stale = (await call(base, `/v1/hydroma/readiness/assessments/${a.id}`, { cookie: owner })).json;
  assert.equal(stale.currentness, "inputs_changed");
  assert.equal(stale.state, "READY_FOR_REVIEW", "snapshot not rewritten");

  // Cross-tenant: foreign owner cannot read the assessment.
  const b = await bootstrap(base, "b@rr.local", "Other");
  await call(base, `/v1/hydroma/readiness/assessments/${a.id}`, { cookie: b, expect: 404 });
});
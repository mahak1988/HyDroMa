/**
 * Phase 3.72 — community activities & participation. Real service + SQLite.
 * Run: node --test services/api/tests/community-activities.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const mk = async (t) => { const db = openDatabase(":memory:"); const s = createServer(createApp({ db })); t.after(() => { s.closeAllConnections(); s.close(); }); s.unref(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); return `http://127.0.0.1:${s.address().port}`; };
async function call(b, p, { method = "GET", body, cookie, expect = 200 } = {}) {
  const r = await fetch(b + p, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  assert.equal(r.status, expect, `${method} ${p} -> ${r.status}: ${text.slice(0, 160)}`); return { json, headers: r.headers };
}
const ck = (h) => h.get("set-cookie").split(";")[0];
const bootstrap = async (b, e, o) => ck((await call(b, "/v1/auth/register", { method: "POST", body: { email: e, name: e, password: PASS, organizationName: o }, expect: 201 })).headers);
async function invite(b, owner, org, email, role) { const inv = (await call(b, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email, role }, expect: 201 })).json; const r = await fetch(b + "/v1/auth/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: inv.inviteToken, password: "disposable-pass-1" }) }); const cookie = r.headers.get("set-cookie").split(";")[0]; const me = (await call(b, "/v1/auth/me", { cookie })).json; return { cookie, id: me.user.id }; }

test("activity lifecycle + participation + history", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@act.local", "Act Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const village = (await call(base, "/v1/resources/villages", { method: "POST", cookie: owner, body: { organizationId: org, name: "Deh A", region: "R" }, expect: 201 })).json;
  const m = await invite(base, owner, org, "p@act.local", "member");

  const act = (await call(base, "/v1/community/activities", { method: "POST", cookie: owner, body: { communityId: String(village.id), title: "Planting Day", category: "agriculture", capacity: 1 }, expect: 201 })).json;
  assert.equal(act.status, "draft");
  await call(base, `/v1/community/activities/${act.id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });
  // Invalid transition draft→completed rejected earlier; published→completed invalid.
  await call(base, `/v1/community/activities/${act.id}/transition`, { method: "POST", cookie: owner, body: { to: "completed" }, expect: 409 });

  // Self-register.
  const reg = await call(base, `/v1/community/activities/${act.id}/participants`, { method: "POST", cookie: m.cookie, expect: 201 });
  assert.equal(reg.json.status, "registered");
  // Duplicate registration is idempotent (200 duplicate).
  const dup = await call(base, `/v1/community/activities/${act.id}/participants`, { method: "POST", cookie: m.cookie });
  assert.equal(dup.json.duplicate, true);
  // Capacity 1: a second distinct user cannot register.
  const m2 = await invite(base, owner, org, "p2@act.local", "member");
  await call(base, `/v1/community/activities/${act.id}/participants`, { method: "POST", cookie: m2.cookie, expect: 409 });

  // Confirm → attend → complete.
  await call(base, `/v1/community/activities/${act.id}/participants/${m.id}/confirm`, { method: "POST", cookie: owner });
  const att = await call(base, `/v1/community/activities/${act.id}/participants/${m.id}/attend`, { method: "POST", cookie: owner });
  assert.equal(att.json.status, "attended");
  await call(base, `/v1/community/activities/${act.id}/transition`, { method: "POST", cookie: owner, body: { to: "in_progress" } });
  const done = await call(base, `/v1/community/activities/${act.id}/transition`, { method: "POST", cookie: owner, body: { to: "completed" } });
  assert.equal(done.json.status, "completed"); assert.ok(done.json.completedAt);

  const events = (await call(base, `/v1/community/activities/${act.id}/events`, { cookie: owner })).json.items;
  for (const ty of ["created", "published", "participant.registered", "participant.confirmed", "participant.attended", "in_progress", "completed"]) assert.ok(events.some((e) => e.type === ty), `missing ${ty}`);
});

test("tenant isolation + unauthorized participation", async (t) => {
  const base = await mk(t);
  const a = await bootstrap(base, "a@act.local", "A Org");
  const orgA = (await call(base, "/v1/organizations", { cookie: a })).json.items[0].id;
  const villageA = (await call(base, "/v1/resources/villages", { method: "POST", cookie: a, body: { organizationId: orgA, name: "VA" }, expect: 201 })).json;
  const act = (await call(base, "/v1/community/activities", { method: "POST", cookie: a, body: { communityId: String(villageA.id), title: "A Act", category: "other" }, expect: 201 })).json;
  await call(base, `/v1/community/activities/${act.id}/transition`, { method: "POST", cookie: a, body: { to: "published" } });
  const b = await bootstrap(base, "b@act.local", "B Org");
  // Foreign owner cannot read the activity.
  await call(base, `/v1/community/activities/${act.id}`, { cookie: b, expect: 404 });
  // Cannot register for another org's activity.
  await call(base, `/v1/community/activities/${act.id}/participants`, { method: "POST", cookie: b, expect: 404 });
});
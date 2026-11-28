/**
 * Phase 3.77 — environmental source registry (catalog only). Real service + SQLite.
 * Run: node --test services/api/tests/env-sources.test.mjs
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

test("source registry: create/list/get/update, RBAC, isolation, no approval, no acquisition", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "own@env.local", "Env Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const s = (await call(base, "/v1/env/sources", { method: "POST", cookie: owner, body: { name: "ECMWF", category: "weather", sourceType: "api", integrationStatus: "CATALOGUED", license: "unknown" }, expect: 201 })).json;
  assert.equal(s.integrationStatus, "CATALOGUED");
  assert.equal(s.licenseReview, "unknown");
  assert.ok((await call(base, "/v1/env/sources", { cookie: owner })).json.total >= 1);
  assert.equal((await call(base, `/v1/env/sources/${s.id}`, { cookie: owner })).json.name, "ECMWF");
  // Update status.
  const up = await call(base, `/v1/env/sources/${s.id}`, { method: "PATCH", cookie: owner, body: { integrationStatus: "DOCUMENTED" } });
  assert.equal(up.json.integrationStatus, "DOCUMENTED");
  // Approval not implemented.
  await call(base, `/v1/env/sources/${s.id}`, { method: "PATCH", cookie: owner, body: { integrationStatus: "INTEGRATION_APPROVED" }, expect: 422 });
  // Invalid category.
  await call(base, "/v1/env/sources", { method: "POST", cookie: owner, body: { name: "Bad", category: "nope", sourceType: "api" }, expect: 422 });
  // Member cannot create.
  const m = await invite(base, owner, org, "m@env.local", "member");
  await call(base, "/v1/env/sources", { method: "POST", cookie: m.cookie, body: { name: "X", category: "soil", sourceType: "file" }, expect: 403 });
  // Cross-tenant: foreign owner cannot read.
  const b = await bootstrap(base, "b@env.local", "Other");
  await call(base, `/v1/env/sources/${s.id}`, { cookie: b, expect: 404 });
});
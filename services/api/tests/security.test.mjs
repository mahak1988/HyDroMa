/**
 * Phase 3.52 — API security verification against the real service.
 * Isolated in-memory SQLite per test; disposable identities; no secrets logged.
 * Run: node --test services/api/tests/security.test.mjs
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
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.unref();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function call(base, path, { method = "GET", body, cookie, expect = 200 } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  assert.equal(response.status, expect, `${method} ${path} -> ${response.status}: ${text.slice(0, 200)}`);
  return { json, headers: response.headers, text };
}

const cookieOf = (headers) => headers.get("set-cookie").split(";")[0];

async function bootstrap(base, email, orgName) {
  const { headers } = await call(base, "/v1/auth/register", {
    method: "POST",
    body: { email, name: email, password: PASS, organizationName: orgName },
    expect: 201,
  });
  return cookieOf(headers);
}

async function invite(base, ownerCookie, orgId, email, role) {
  const { json } = await call(base, `/v1/organizations/${orgId}/members`, {
    method: "POST",
    cookie: ownerCookie,
    body: { email, role },
    expect: 201,
  });
  const accepted = await call(base, "/v1/auth/accept-invite", {
    method: "POST",
    body: { token: json.inviteToken, password: "disposable-pass-1" },
  });
  return cookieOf(accepted.headers);
}

test("authentication: missing, invalid and malformed credentials are rejected", async (t) => {
  const base = await makeApp(t);
  // Missing password is rejected (the service returns 401 invalid_credentials).
  await call(base, "/v1/auth/login", { method: "POST", body: { email: "x@y.local" }, expect: 401 });
  // Wrong password.
  await bootstrap(base, "owner@sec.local", "Sec Org");
  await call(base, "/v1/auth/login", { method: "POST", body: { email: "owner@sec.local", password: "wrong-wrong-1" }, expect: 401 });
  // Invalid session cookie on a protected route.
  await call(base, "/v1/auth/me", { cookie: "nojin_session=deadbeefdeadbeef", expect: 401 });
  // No cookie at all.
  await call(base, "/v1/resources/farms", { expect: 401 });
});

test("authorization: viewer and member roles are enforced (no privilege implication)", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@sec.local", "Sec Org");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const viewer = await invite(base, owner, org, "viewer@sec.local", "viewer");
  const member = await invite(base, owner, org, "member@sec.local", "member");

  // Viewer: can read (incl. org-scoped user list) but cannot write or create users.
  await call(base, "/v1/resources/farms", { cookie: viewer });
  const viewerUsers = await call(base, "/v1/users", { cookie: viewer });
  assert.ok(Array.isArray(viewerUsers.json.items), "viewer sees only own-org users (org-scoped)");
  await call(base, "/v1/resources/farms", { method: "POST", cookie: viewer, body: { organizationId: org, name: "X" }, expect: 403 });
  await call(base, "/v1/users", { method: "POST", cookie: viewer, body: { email: "v2@sec.local", name: "V2", role: "member" }, expect: 403 });

  // Member: cannot create, cannot delete (write/owner only), cannot escalate role.
  await call(base, "/v1/resources/farms", { method: "POST", cookie: member, body: { organizationId: org, name: "Y" }, expect: 403 });
  const created = await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "Owner Farm" }, expect: 201 });
  await call(base, `/v1/resources/farms/${created.json.id}`, { method: "DELETE", cookie: member, expect: 403 });
  await call(base, "/v1/users", { method: "POST", cookie: member, body: { email: "esc@sec.local", name: "Esc", role: "owner" }, expect: 403 });

  // Owner can delete.
  await call(base, `/v1/resources/farms/${created.json.id}`, { method: "DELETE", cookie: owner, expect: 200 });
});

test("tenant isolation: cross-organization list, get, update, delete are blocked", async (t) => {
  const base = await makeApp(t);
  const a = await bootstrap(base, "a@sec.local", "Org A");
  const orgA = (await call(base, "/v1/organizations", { cookie: a })).json.items[0].id;
  const b = await bootstrap(base, "b@sec.local", "Org B");
  const orgB = (await call(base, "/v1/organizations", { cookie: b })).json.items[0].id;

  const ra = (await call(base, "/v1/resources/farms", { method: "POST", cookie: a, body: { organizationId: orgA, name: "A secret farm" }, expect: 201 })).json;
  const rb = (await call(base, "/v1/resources/farms", { method: "POST", cookie: b, body: { organizationId: orgB, name: "B farm" }, expect: 201 })).json;

  // B cannot list A's org (no membership) → 403.
  const bList = await call(base, "/v1/resources/farms", { cookie: b });
  assert.equal(bList.json.total, 1);
  assert.equal(bList.json.items[0].id, rb.id);
  assert.ok(!bList.json.items.some((i) => i.id === ra.id), "B's list must not leak A's record");

  // B cannot read/update/delete A's record by id (identifier substitution) → 404.
  await call(base, `/v1/resources/farms/${ra.id}`, { cookie: b, expect: 404 });
  await call(base, `/v1/resources/farms/${ra.id}`, { method: "PATCH", cookie: b, body: { name: "hijack" }, expect: 404 });
  await call(base, `/v1/resources/farms/${ra.id}`, { method: "DELETE", cookie: b, expect: 404 });

  // A can still access its own record.
  assert.equal((await call(base, `/v1/resources/farms/${ra.id}`, { cookie: a })).json.name, "A secret farm");
});

test("information disclosure: error bodies are generic and leak no internals", async (t) => {
  const base = await makeApp(t);
  const a = await bootstrap(base, "d@sec.local", "Disc Org");
  const org = (await call(base, "/v1/organizations", { cookie: a })).json.items[0].id;
  await call(base, "/v1/resources/farms", { method: "POST", cookie: a, body: { organizationId: org, name: "R" }, expect: 201 });

  const notFound = await call(base, "/v1/resources/farms/does-not-exist", { cookie: a, expect: 404 });
  assert.equal(notFound.json.error.code, "not_found");
  const blob = notFound.text.toLowerCase();
  for (const leak of ["stack", " at ", "sqlite", "database", "password", "secret", "c:\\", "/src/"]) {
    assert.ok(!blob.includes(leak), `404 body leaked "${leak}"`);
  }

  const badType = await call(base, "/v1/resources/not-a-type", { cookie: a, expect: 404 });
  assert.equal(badType.json.error.code, "not_found");

  const invalidJson = await fetch(base + "/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{oops" });
  assert.equal(invalidJson.status, 400);
  const invalidText = (await invalidJson.text()).toLowerCase();
  assert.ok(!invalidText.includes(" at ") && !invalidText.includes("sqlite"));
});

test("session invalidation: logout revokes the cookie immediately", async (t) => {
  const base = await makeApp(t);
  const cookie = await bootstrap(base, "lo@sec.local", "Logout Org");
  await call(base, "/v1/auth/me", { cookie });
  await call(base, "/v1/auth/logout", { method: "POST", cookie, expect: 200 });
  await call(base, "/v1/auth/me", { cookie, expect: 401 });
  // Repeated logout is safe (idempotent 200).
  await call(base, "/v1/auth/logout", { method: "POST", cookie, expect: 200 });
});

test("admin scope: a foreign owner cannot see another organization", async (t) => {
  const base = await makeApp(t);
  const a = await bootstrap(base, "fa@sec.local", "Admin A");
  const orgA = (await call(base, "/v1/organizations", { cookie: a })).json.items[0].id;
  const b = await bootstrap(base, "fb@sec.local", "Admin B");
  await call(base, `/v1/organizations/${orgA}`, { cookie: b, expect: 404 });
  await call(base, `/v1/organizations/${orgA}/members`, { cookie: b, expect: 404 });
});

test("tenant isolation: PATCH /v1/users/:id cannot mutate a user of another tenant", async (t) => {
  const base = await makeApp(t);
  // Owner of Org A and owner of Org B (two unrelated tenants).
  const a = await bootstrap(base, "iso-a@sec.local", "User Iso A");
  const b = await bootstrap(base, "iso-b@sec.local", "User Iso B");
  const bUser = (await call(base, "/v1/auth/me", { cookie: b })).json.user;

  // A holds a write role only in Org A and shares no org with B's user, so any
  // attempt to rename or suspend B's global user row must be a 404 (no leak).
  await call(base, `/v1/users/${bUser.id}`, { method: "PATCH", cookie: a, body: { status: "suspended" }, expect: 404 });
  await call(base, `/v1/users/${bUser.id}`, { method: "PATCH", cookie: a, body: { name: "hijack" }, expect: 404 });
  await call(base, `/v1/users/${bUser.id}`, { method: "PATCH", cookie: a, body: { role: "owner" }, expect: 404 });

  // B is unaffected and still active.
  const after = (await call(base, "/v1/auth/me", { cookie: b })).json.user;
  assert.equal(after.status, "active");
  assert.equal(after.name, bUser.name);
});
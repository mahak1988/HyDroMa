/**
 * End-to-end API tests against a real in-memory SQLite database.
 * Covers: bootstrap, login, invite/accept, tenancy isolation, RBAC, resources CRUD, catalog, models.
 * Run: node --test services/api/tests/api.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";

async function makeApp(t) {
  const db = openDatabase(":memory:");
  const handler = createApp({ db });
  const server = createServer(handler);
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.unref();
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
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
  const json = text ? JSON.parse(text) : null;
  assert.equal(response.status, expect, `${method} ${path} -> ${response.status}: ${text.slice(0, 240)}`);
  return { json, headers: response.headers };
}

const cookieOf = (headers) => headers.get("set-cookie").split(";")[0];

test("health", async (t) => {
  const base = await makeApp(t);
  const { json } = await call(base, "/health");
  assert.equal(json.status, "ok");
});

test("bootstrap creates owner, organization and membership; second bootstrap is refused", async (t) => {
  const base = await makeApp(t);
  const { json, headers } = await call(base, "/v1/auth/register", {
    method: "POST",
    body: { email: "owner@nojin.local", name: "Platform Owner", password: PASS, organizationName: "Eco Nojin" },
    expect: 201,
  });
  assert.equal(json.user.email, "owner@nojin.local");
  assert.equal(json.organizations[0].kind, "community");
  assert.ok(headers.get("set-cookie").includes("nojin_session="));
  await call(base, "/v1/auth/register", { method: "POST", body: { email: "owner@nojin.local", name: "Owner Again", password: PASS }, expect: 409 });
});

test("login sets cookie; me returns memberships; wrong password rejected", async (t) => {
  const base = await makeApp(t);
  await call(base, "/v1/auth/register", { method: "POST", body: { email: "a@b.local", name: "AA", password: PASS, organizationName: "AA Farm" }, expect: 201 });
  await call(base, "/v1/auth/login", { method: "POST", body: { email: "a@b.local", password: "nope-nope-nope" }, expect: 401 });
  const { json, headers } = await call(base, "/v1/auth/login", { method: "POST", body: { email: "a@b.local", password: PASS } });
  assert.equal(json.user.email, "a@b.local");
  const cookie = cookieOf(headers);
  const me = await call(base, "/v1/auth/me", { cookie });
  assert.equal(me.json.memberships.length, 1);
  assert.equal(me.json.memberships[0].role, "owner");
});

test("auth required for protected routes; empty database returns empty lists", async (t) => {
  const base = await makeApp(t);
  await call(base, "/v1/users", { expect: 401 });
  await call(base, "/v1/organizations", { expect: 401 });
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email: "o@b.local", name: "OO", password: PASS, organizationName: "OO Farm" }, expect: 201 });
  const cookie = cookieOf(headers);
  const users = await call(base, "/v1/users", { cookie });
  assert.equal(users.json.total, 1);
  const sellers = await call(base, "/v1/catalog/sellers", { cookie });
  assert.deepEqual(sellers.json.items, []);
});

test("members: invite, accept-invite, role change, tenancy isolation", async (t) => {
  const base = await makeApp(t);
  const c1 = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "o1@b.local", name: "O1", password: PASS, organizationName: "Org One" }, expect: 201 })).headers);
  const org1 = (await call(base, "/v1/organizations", { cookie: c1 })).json.items[0].id;
  const c2 = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "o2@b.local", name: "O2", password: PASS, organizationName: "Org Two" }, expect: 201 })).headers);

  const invite = await call(base, `/v1/organizations/${org1}/members`, { method: "POST", cookie: c1, body: { email: "worker@b.local", role: "member" }, expect: 201 });
  assert.equal(invite.json.role, "member");
  assert.ok(invite.json.inviteToken);

  // The invited user sets a password with the one-time token.
  const accepted = await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "worker-password-1" } });
  assert.equal(accepted.json.user.email, "worker@b.local");
  const worker = cookieOf(accepted.headers);

  // Reusing the token fails.
  await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "worker-password-1" }, expect: 404 });

  // The worker sees the org but cannot manage members.
  assert.equal((await call(base, `/v1/organizations/${org1}`, { cookie: worker })).json.id, org1);
  await call(base, `/v1/organizations/${org1}/members/${invite.json.id}`, { method: "PATCH", cookie: worker, body: { role: "admin" }, expect: 403 });

  // A foreign owner cannot even see the org.
  await call(base, `/v1/organizations/${org1}`, { cookie: c2, expect: 404 });

  const changed = await call(base, `/v1/organizations/${org1}/members/${invite.json.id}`, { method: "PATCH", cookie: c1, body: { role: "manager" } });
  assert.equal(changed.json.role, "manager");

  // Re-inviting an existing member fails.
  await call(base, `/v1/organizations/${org1}/members`, { method: "POST", cookie: c1, body: { email: "worker@b.local", role: "member" }, expect: 409 });
});

test("resources CRUD with RBAC: member cannot create, owner can delete, cross-org invisible", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "own@b.local", name: "Own", password: PASS, organizationName: "Farm Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "m@b.local", role: "member" }, expect: 201 });
  const member = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "member-password-1" } })).headers);

  await call(base, "/v1/resources/villages", { method: "POST", cookie: member, body: { organizationId: org, name: "V" }, expect: 403 });

  const created = await call(base, "/v1/resources/villages", { method: "POST", cookie: owner, body: { organizationId: org, name: "Deh Nokhod", population: 820 }, expect: 201 });
  assert.equal(created.json.name, "Deh Nokhod");

  const patched = await call(base, `/v1/resources/villages/${created.json.id}`, { method: "PATCH", cookie: owner, body: { population: 850 } });
  assert.equal(patched.json.population, 850);
  assert.equal(patched.json.name, "Deh Nokhod");

  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "z@b.local", name: "ZZ", password: PASS, organizationName: "Other Co" }, expect: 201 })).headers);
  await call(base, `/v1/resources/villages/${created.json.id}`, { cookie: other, expect: 404 });

  await call(base, `/v1/resources/villages/${created.json.id}`, { method: "DELETE", cookie: member, expect: 403 });
  await call(base, `/v1/resources/villages/${created.json.id}`, { method: "DELETE", cookie: owner });
  await call(base, `/v1/resources/villages/${created.json.id}`, { cookie: owner, expect: 404 });
});

test("field surveys sync through the resources API", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "field@b.local", name: "Field", password: PASS, organizationName: "Field Co" }, expect: 201 })).headers);

  const created = await call(base, "/v1/resources/surveys", { method: "POST", cookie: owner, body: { siteName: "Kondor terrace", notes: "Soil sample 12", status: "pending" }, expect: 201 });
  assert.equal(created.json.siteName, "Kondor terrace");
  assert.ok(created.json.id);

  const listed = await call(base, "/v1/resources/surveys", { cookie: owner });
  assert.equal(listed.json.total, 1);
  assert.equal(listed.json.items[0].siteName, "Kondor terrace");
});

test("recorded runs are listed through GET /v1/runs", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "runs@b.local", name: "Runs", password: PASS, organizationName: "Runs Co" }, expect: 201 })).headers);

  await call(base, "/v1/resources/runs", { method: "POST", cookie: owner, body: { model: "water-balance", version: "1.0.0", status: "completed" }, expect: 201 });
  const listed = await call(base, "/v1/runs", { cookie: owner });
  assert.equal(listed.json.total, 1);
  assert.equal(listed.json.items[0].model, "water-balance");
});

test("catalog: categories exist, product creation validates price", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "c@b.local", name: "CC", password: PASS, organizationName: "CC Market" }, expect: 201 })).headers);

  const cats = (await call(base, "/v1/catalog/categories", { cookie: owner })).json;
  assert.ok(Array.isArray(cats.items));

  await call(base, "/v1/catalog/products", { method: "POST", cookie: owner, body: { name: "Bad", priceMinor: 1.5 }, expect: 422 });
  const product = await call(base, "/v1/catalog/products", { method: "POST", cookie: owner, body: { name: "Branded Chickpea", priceMinor: 425000, unit: "kg", stock: 120 }, expect: 201 });
  assert.equal(product.json.price.amountMinor, 425000);
  const list = (await call(base, "/v1/catalog/products", { cookie: owner })).json;
  assert.equal(list.total, 1);
});

test("models registry served by the API", async (t) => {
  const base = await makeApp(t);
  const { json } = await call(base, "/v1/models");
  assert.equal(json.source, "eco-nojin-api");
  assert.ok(json.models.some((m) => m.id === "eco-nojin.hydroma.water-balance"));
});

test("logout clears the session", async (t) => {
  const base = await makeApp(t);
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email: "l@b.local", name: "LL", password: PASS }, expect: 201 });
  const cookie = cookieOf(headers);
  await call(base, "/v1/auth/logout", { method: "POST", cookie });
  await call(base, "/v1/auth/me", { cookie, expect: 401 });
});

test("payload limits and invalid JSON are handled", async (t) => {
  const base = await makeApp(t);
  const response = await fetch(base + "/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{oops" });
  assert.equal(response.status, 400);
});

test("invitations endpoint returns the contract shape and the token works", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "inv@b.local", name: "IN", password: PASS, organizationName: "Inv Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const invitation = await call(base, `/v1/organizations/${org}/invitations`, { method: "POST", cookie: owner, body: { email: "new@b.local", role: "member" }, expect: 201 });
  assert.equal(invitation.json.status, "pending");
  assert.equal(invitation.json.organizationId, org);
  assert.ok(invitation.json.inviteToken);

  const listed = (await call(base, `/v1/organizations/${org}/invitations`, { cookie: owner })).json;
  assert.equal(listed.total, 1);
  assert.equal(listed.items[0].email, "new@b.local");

  await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invitation.json.inviteToken, password: "newuser-pass-1" } });
  const after = (await call(base, `/v1/organizations/${org}/invitations`, { cookie: owner })).json;
  assert.equal(after.items[0].status, "accepted");
});

test("users.create makes an invited user; role update goes through PATCH", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "adm@b.local", name: "AD", password: PASS, organizationName: "Adm Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const created = await call(base, "/v1/users", { method: "POST", cookie: owner, body: { email: "crew@b.local", name: "Crew One", role: "member" }, expect: 201 });
  assert.equal(created.json.status, "invited");

  const members = (await call(base, `/v1/organizations/${org}/members`, { cookie: owner })).json.items;
  const crew = members.find((m) => m.userId === created.json.id);
  const updated = await call(base, `/v1/organizations/${org}/members/${crew.id}`, { method: "PATCH", cookie: owner, body: { role: "manager" } });
  assert.equal(updated.json.role, "manager");

  const patched = await call(base, `/v1/users/${created.json.id}`, { method: "PATCH", cookie: owner, body: { status: "suspended" } });
  assert.equal(patched.json.status, "suspended");
});

test("project status workflow: create starts planned; legal transitions advance; illegal/forced writes rejected", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "wf@b.local", name: "WF", password: PASS, organizationName: "Workflow Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  // A client-supplied status is ignored on create: a project always starts planned.
  const created = await call(base, "/v1/resources/projects", { method: "POST", cookie: owner, body: { organizationId: org, name: "Terrace Restoration", status: "completed" }, expect: 201 });
  assert.equal(created.json.status, "planned");
  const id = created.json.id;

  // Direct status write via PATCH is rejected (state machine cannot be bypassed).
  await call(base, `/v1/resources/projects/${id}`, { method: "PATCH", cookie: owner, body: { status: "active" }, expect: 409 });

  // Illegal edge (planned → completed) is rejected with the allowed set.
  const bad = await call(base, `/v1/resources/projects/${id}/transition`, { method: "POST", cookie: owner, body: { to: "completed" }, expect: 409 });
  assert.equal(bad.json.error.code, "invalid_transition");
  assert.deepEqual(bad.json.error.details.allowed, ["active", "on_hold"]);

  // Unknown status is a 422.
  await call(base, `/v1/resources/projects/${id}/transition`, { method: "POST", cookie: owner, body: { to: "archived" }, expect: 422 });

  // Legal path: planned → active → completed.
  const active = await call(base, `/v1/resources/projects/${id}/transition`, { method: "POST", cookie: owner, body: { to: "active" } });
  assert.equal(active.json.status, "active");
  const done = await call(base, `/v1/resources/projects/${id}/transition`, { method: "POST", cookie: owner, body: { to: "completed" } });
  assert.equal(done.json.status, "completed");

  // Completed is terminal: no outgoing edge.
  await call(base, `/v1/resources/projects/${id}/transition`, { method: "POST", cookie: owner, body: { to: "active" }, expect: 409 });

  // A member (write role) can transition; a viewer cannot.
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "viewer@b.local", role: "viewer" }, expect: 201 });
  const viewer = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "viewer-pass-1" } })).headers);
  const p2 = await call(base, "/v1/resources/projects", { method: "POST", cookie: owner, body: { organizationId: org, name: "Second" }, expect: 201 });
  await call(base, `/v1/resources/projects/${p2.json.id}/transition`, { method: "POST", cookie: viewer, body: { to: "active" }, expect: 403 });

  // Cross-org transition is invisible (404).
  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "zz@b.local", name: "ZZ", password: PASS, organizationName: "Other" }, expect: 201 })).headers);
  await call(base, `/v1/resources/projects/${p2.json.id}/transition`, { method: "POST", cookie: other, body: { to: "active" }, expect: 404 });
});

test("crop-cycle workflow: agronomic validation, lifecycle, locked plan, harvest yield attainment", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "agri@b.local", name: "Agri", password: PASS, organizationName: "Agri Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  // A farm to attach the cycle to (area 10 ha).
  const farm = await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "North Field", areaHa: 10 }, expect: 201 });

  // Missing farm is rejected.
  await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Wheat", areaHa: 5, seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 422 });
  // Unknown farm (cross-org style) → 404.
  await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Wheat", farmId: "nope", areaHa: 5, seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 404 });
  // Area exceeds the farm → 422.
  await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Wheat", farmId: farm.json.id, areaHa: 50, seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 422 });
  // End before start → 422.
  await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Wheat", farmId: farm.json.id, areaHa: 5, seasonStart: "2026-06-01", seasonEnd: "2026-03-01" }, expect: 422 });

  // Valid create starts `planned` and ignores a client status.
  const created = await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Wheat", farmId: farm.json.id, areaHa: 5, seasonStart: "2026-03-01", seasonEnd: "2026-06-01", expectedYield: 1000, status: "harvested" }, expect: 201 });
  assert.equal(created.json.status, "planned");
  assert.equal(created.json.yieldAttainmentPct, null);
  const id = created.json.id;

  // Direct status write is rejected; plan is editable while planned.
  await call(base, `/v1/resources/cropCycles/${id}`, { method: "PATCH", cookie: owner, body: { status: "growing" }, expect: 409 });
  await call(base, `/v1/resources/cropCycles/${id}`, { method: "PATCH", cookie: owner, body: { areaHa: 4 } });

  // Lifecycle: planned → approved → planted → growing. Plan locks after approval.
  await call(base, `/v1/resources/cropCycles/${id}/transition`, { method: "POST", cookie: owner, body: { to: "approved" } });
  await call(base, `/v1/resources/cropCycles/${id}`, { method: "PATCH", cookie: owner, body: { areaHa: 3 }, expect: 409 });
  // Illegal skip (approved → harvested) rejected.
  await call(base, `/v1/resources/cropCycles/${id}/transition`, { method: "POST", cookie: owner, body: { to: "harvested" }, expect: 409 });
  await call(base, `/v1/resources/cropCycles/${id}/transition`, { method: "POST", cookie: owner, body: { to: "planted" } });
  await call(base, `/v1/resources/cropCycles/${id}/transition`, { method: "POST", cookie: owner, body: { to: "growing" } });

  // Harvest requires a non-negative actual yield and derives attainment (800/1000 = 80%).
  await call(base, `/v1/resources/cropCycles/${id}/transition`, { method: "POST", cookie: owner, body: { to: "harvested" }, expect: 422 });
  const harvested = await call(base, `/v1/resources/cropCycles/${id}/transition`, { method: "POST", cookie: owner, body: { to: "harvested", actualYield: 800 } });
  assert.equal(harvested.json.status, "harvested");
  assert.equal(harvested.json.yieldAttainmentPct, 80);

  // A viewer cannot create a cycle.
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "view@b.local", role: "viewer" }, expect: 201 });
  const viewer = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "view-pass-1" } })).headers);
  await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: viewer, body: { organizationId: org, crop: "Barley", farmId: farm.json.id, areaHa: 1, seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }, expect: 403 });
});

test("irrigation events: observation CRUD with farm/crop-cycle integrity, tenancy and RBAC", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "irr@b.local", name: "Irr", password: PASS, organizationName: "Irr Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const farm = await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "River Plot", areaHa: 8 }, expect: 201 });
  const cycle = await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Maize", farmId: farm.json.id, areaHa: 4, seasonStart: "2026-04-01", seasonEnd: "2026-09-01" }, expect: 201 });

  // Missing farm → 422; unknown farm → 404.
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, quantity: 10, unit: "mm", occurredAt: "2026-05-01T08:00" }, expect: 422 });
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: "nope", quantity: 10, unit: "mm", occurredAt: "2026-05-01T08:00" }, expect: 404 });
  // Bad quantity / unit / datetime.
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, quantity: 0, unit: "mm", occurredAt: "2026-05-01T08:00" }, expect: 422 });
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, quantity: 5, unit: "gallon", occurredAt: "2026-05-01T08:00" }, expect: 422 });
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, quantity: 5, unit: "mm", occurredAt: "not-a-date" }, expect: 422 });
  // Crop cycle from a different farm → mismatch.
  const otherFarm = await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "Hill Plot", areaHa: 3 }, expect: 201 });
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: otherFarm.json.id, cropCycleId: cycle.json.id, quantity: 5, unit: "mm", occurredAt: "2026-05-01T08:00" }, expect: 422 });

  // Valid create.
  const created = await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, cropCycleId: cycle.json.id, quantity: 12.5, unit: "mm", method: "drip", occurredAt: "2026-05-01T08:00", notes: "Morning set" }, expect: 201 });
  assert.equal(created.json.quantity, 12.5);
  assert.equal(created.json.method, "drip");
  const id = created.json.id;

  // List + get.
  const listed = await call(base, "/v1/resources/irrigationEvents", { cookie: owner });
  assert.equal(listed.json.total, 1);
  const one = await call(base, `/v1/resources/irrigationEvents/${id}`, { cookie: owner });
  assert.equal(one.json.farmId, farm.json.id);

  // Edit re-validates (bad quantity rejected), good edit persists.
  await call(base, `/v1/resources/irrigationEvents/${id}`, { method: "PATCH", cookie: owner, body: { quantity: -1 }, expect: 422 });
  const patched = await call(base, `/v1/resources/irrigationEvents/${id}`, { method: "PATCH", cookie: owner, body: { quantity: 15 } });
  assert.equal(patched.json.quantity, 15);

  // Tenancy: a foreign owner cannot see it.
  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "foreign@b.local", name: "Frn", password: PASS, organizationName: "Foreign" }, expect: 201 })).headers);
  await call(base, `/v1/resources/irrigationEvents/${id}`, { cookie: other, expect: 404 });

  // RBAC: viewer cannot create; owner can delete.
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "iview@b.local", role: "viewer" }, expect: 201 });
  const viewer = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "iview-pass-1" } })).headers);
  await call(base, "/v1/resources/irrigationEvents", { method: "POST", cookie: viewer, body: { organizationId: org, farmId: farm.json.id, quantity: 5, unit: "mm", occurredAt: "2026-05-02T08:00" }, expect: 403 });
  await call(base, `/v1/resources/irrigationEvents/${id}`, { method: "DELETE", cookie: viewer, expect: 403 });
  await call(base, `/v1/resources/irrigationEvents/${id}`, { method: "DELETE", cookie: owner });
  await call(base, `/v1/resources/irrigationEvents/${id}`, { cookie: owner, expect: 404 });
});

test("field observations: observation CRUD with farm/crop-cycle integrity, tenancy and RBAC", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "obs@b.local", name: "Obs", password: PASS, organizationName: "Obs Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const farm = await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "Meadow", areaHa: 6 }, expect: 201 });
  const cycle = await call(base, "/v1/resources/cropCycles", { method: "POST", cookie: owner, body: { organizationId: org, crop: "Alfalfa", farmId: farm.json.id, areaHa: 3, seasonStart: "2026-03-01", seasonEnd: "2026-10-01" }, expect: 201 });

  // Missing farm → 422; unknown farm → 404.
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, category: "soil", observer: "Ali", observedAt: "2026-05-01T09:00", description: "Dry topsoil" }, expect: 422 });
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: "nope", category: "soil", observer: "Ali", observedAt: "2026-05-01T09:00", description: "Dry topsoil" }, expect: 404 });
  // Bad category / severity / observer / description / datetime.
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, category: "weather", observer: "Ali", observedAt: "2026-05-01T09:00", description: "x" }, expect: 422 });
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, category: "soil", severity: "severe", observer: "Ali", observedAt: "2026-05-01T09:00", description: "Dry" }, expect: 422 });
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, category: "soil", observer: "", observedAt: "2026-05-01T09:00", description: "Dry" }, expect: 422 });
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, category: "soil", observer: "Ali", observedAt: "2026-05-01T09:00", description: "" }, expect: 422 });
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, category: "soil", observer: "Ali", observedAt: "nope", description: "Dry" }, expect: 422 });
  // Crop cycle from a different farm → mismatch.
  const otherFarm = await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "Ridge", areaHa: 2 }, expect: 201 });
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: otherFarm.json.id, cropCycleId: cycle.json.id, category: "soil", observer: "Ali", observedAt: "2026-05-01T09:00", description: "Dry" }, expect: 422 });

  // Valid create.
  const created = await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: owner, body: { organizationId: org, farmId: farm.json.id, cropCycleId: cycle.json.id, category: "crop_health", severity: "moderate", observer: "Sara", observedAt: "2026-05-01T09:00", description: "Lower leaves yellowing", notes: "Patch near gate" }, expect: 201 });
  assert.equal(created.json.observer, "Sara");
  assert.equal(created.json.severity, "moderate");
  const id = created.json.id;

  // List + get.
  const listed = await call(base, "/v1/resources/fieldObservations", { cookie: owner });
  assert.equal(listed.json.total, 1);
  const one = await call(base, `/v1/resources/fieldObservations/${id}`, { cookie: owner });
  assert.equal(one.json.farmId, farm.json.id);

  // Edit re-validates (bad severity rejected), good edit persists.
  await call(base, `/v1/resources/fieldObservations/${id}`, { method: "PATCH", cookie: owner, body: { severity: "extreme" }, expect: 422 });
  const patched = await call(base, `/v1/resources/fieldObservations/${id}`, { method: "PATCH", cookie: owner, body: { severity: "high" } });
  assert.equal(patched.json.severity, "high");

  // Tenancy: foreign owner cannot see it.
  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "fobs@b.local", name: "Frn", password: PASS, organizationName: "Foreign" }, expect: 201 })).headers);
  await call(base, `/v1/resources/fieldObservations/${id}`, { cookie: other, expect: 404 });

  // RBAC: viewer cannot create/delete; owner deletes.
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "oview@b.local", role: "viewer" }, expect: 201 });
  const viewer = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "oview-pass-1" } })).headers);
  await call(base, "/v1/resources/fieldObservations", { method: "POST", cookie: viewer, body: { organizationId: org, farmId: farm.json.id, category: "soil", observer: "V", observedAt: "2026-05-02T09:00", description: "note" }, expect: 403 });
  await call(base, `/v1/resources/fieldObservations/${id}`, { method: "DELETE", cookie: viewer, expect: 403 });
  await call(base, `/v1/resources/fieldObservations/${id}`, { method: "DELETE", cookie: owner });
  await call(base, `/v1/resources/fieldObservations/${id}`, { cookie: owner, expect: 404 });
});

/* --------------------- Phase 3.64 rewards & challenges -------------------- */

test("ecocoin: owner/admin adjustments are idempotent, append-only and tenancy-isolated", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "eco@b.local", name: "Eco", password: PASS, organizationName: "Eco Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const me = (await call(base, "/v1/auth/me", { cookie: owner })).json;
  const userId = me.user.id;

  // A member (non write-role) cannot post adjustments.
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "mem@b.local", role: "member" }, expect: 201 });
  const member = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "mem-pass-1" } })).headers);
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: member, body: { userId, amount: 10, entryType: "credit", reason: "test" }, expect: 403 });

  // Validation: bad amount / entryType / reason / unknown user.
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: -5, entryType: "credit", reason: "test" }, expect: 422 });
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: 5, entryType: "mint", reason: "test" }, expect: 422 });
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: 5, entryType: "credit", reason: "" }, expect: 422 });
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId: "nope", amount: 5, entryType: "credit", reason: "test" }, expect: 404 });

  // Owner credit 100.
  const credit = await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: 100, entryType: "credit", reason: "genesis" }, expect: 201 });
  assert.equal(credit.json.entry.entryType, "credit");
  assert.equal(credit.json.entry.amount, 100);
  assert.equal(credit.json.duplicate, false);

  // Balance reflects the credit; summary aggregates.
  const bal = await call(base, `/v1/ecocoin/balance?userId=${userId}`, { cookie: owner });
  assert.equal(bal.json.balance, 100);
  const summary = await call(base, "/v1/ecocoin/summary", { cookie: owner });
  assert.equal(summary.json.balance, 100);
  assert.equal(summary.json.totalCredits, 100);

  // A debit reduces the balance (compensating entry, not a rewrite).
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: 30, entryType: "debit", reason: "correction" }, expect: 201 });
  const bal2 = await call(base, `/v1/ecocoin/balance?userId=${userId}`, { cookie: owner });
  assert.equal(bal2.json.balance, 70);

  // Ledger is append-only over the API: there is no update/delete route.
  await call(base, `/v1/ecocoin/ledger`, { method: "POST", cookie: owner, body: {}, expect: 404 });
  const ledger = await call(base, "/v1/ecocoin/ledger", { cookie: owner });
  assert.equal(ledger.json.total, 2);
  assert.ok(ledger.json.items.every((e) => e.entryType === "credit" || e.entryType === "debit"));

  // Reconciliation recomputes balances and reports no anomaly.
  const recon = await call(base, "/v1/ecocoin/reconcile", { cookie: owner });
  assert.equal(recon.json.totalBalance, 70);
  assert.deepEqual(recon.json.anomalies, []);

  // Tenancy: a foreign owner cannot read the target org's ledger or balance.
  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "foreign-eco@b.local", name: "Frn", password: PASS, organizationName: "Foreign Eco" }, expect: 201 })).headers);
  await call(base, `/v1/ecocoin/ledger?organizationId=${org}`, { cookie: other, expect: 404 });
  await call(base, `/v1/ecocoin/balance?organizationId=${org}&userId=${userId}`, { cookie: other, expect: 404 });

  // A member cannot read the org ledger (write role required).
  await call(base, "/v1/ecocoin/ledger", { cookie: member, expect: 403 });
});

test("reward rules: CRUD, code uniqueness, RBAC and tenancy", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "rule@b.local", name: "Rule", password: PASS, organizationName: "Rule Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  // Validation.
  await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "x", title: "T" }, expect: 422 });
  await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "good", title: "T", ecoCoinAmount: -1 }, expect: 422 });

  const created = await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "plant-tree", title: "Plant a tree", ecoCoinAmount: 50, issuanceLimit: 1000 }, expect: 201 });
  assert.equal(created.json.ecoCoinAmount, 50);
  const ruleId = created.json.id;

  // Duplicate code is refused.
  await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "plant-tree", title: "Dup" }, expect: 409 });

  // List + patch.
  const listed = await call(base, "/v1/rewards/rules", { cookie: owner });
  assert.equal(listed.json.total, 1);
  const patched = await call(base, `/v1/rewards/rules/${ruleId}`, { method: "PATCH", cookie: owner, body: { ecoCoinAmount: 75, status: "inactive" } });
  assert.equal(patched.json.ecoCoinAmount, 75);
  assert.equal(patched.json.status, "inactive");

  // Tenancy: foreign owner cannot see the rule.
  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "foreign-rule@b.local", name: "Frn", password: PASS, organizationName: "Foreign Rule" }, expect: 201 })).headers);
  const foreignList = await call(base, "/v1/rewards/rules", { cookie: other });
  assert.deepEqual(foreignList.json.items, []);
});

test("challenges: lifecycle state machine, participation integrity and verification reward", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "chl@b.local", name: "Chl", password: PASS, organizationName: "Chl Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const me = (await call(base, "/v1/auth/me", { cookie: owner })).json;
  const ownerId = me.user.id;

  // A reward rule the challenge will reference.
  const rule = await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "harvest", title: "Harvest", ecoCoinAmount: 40, issuanceLimit: 40 }, expect: 201 });

  // Create a draft challenge (validation: bad window, unknown rule).
  await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code: "c1", title: "Harvest challenge", startAt: "2026-09-01", endAt: "2026-08-01" }, expect: 422 });
  await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code: "c1", title: "Harvest challenge", rewardRuleId: "nope" }, expect: 404 });
  const created = await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code: "harvest-2026", title: "Harvest 2026", description: "Bring the harvest in", rewardRuleId: rule.json.id, verificationMethod: "admin_attestation" }, expect: 201 });
  assert.equal(created.json.status, "draft");
  const id = created.json.id;

  // Status is workflow-owned: a direct write is rejected.
  await call(base, `/v1/challenges/${id}`, { method: "PATCH", cookie: owner, body: { status: "published" }, expect: 409 });

  // Cannot participate while draft.
  await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: owner, expect: 409 });

  // Lifecycle: draft → published → closed → archived; illegal skip rejected.
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "closed" }, expect: 409 });
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });

  // Owner participates; duplicate participation is refused.
  const p = await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: owner, expect: 201 });
  assert.equal(p.json.status, "joined");
  await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: owner, expect: 409 });
  const pid = p.json.id;

  // A member cannot verify (owner/admin only).
  const invite = await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "ver@b.local", role: "member" }, expect: 201 });
  const member = cookieOf((await call(base, "/v1/auth/accept-invite", { method: "POST", body: { token: invite.json.inviteToken, password: "ver-pass-1" } })).headers);
  await call(base, `/v1/challenges/${id}/participations/${pid}/verify`, { method: "POST", cookie: member, body: {}, expect: 403 });

  // Verification issues the reward exactly once (idempotent), within the rule limit.
  const verified = await call(base, `/v1/challenges/${id}/participations/${pid}/verify`, { method: "POST", cookie: owner, body: { verification: "saw the harvest" }, expect: 200 });
  assert.equal(verified.json.participation.status, "verified");
  assert.equal(verified.json.reward.entry.amount, 40);
  assert.equal(verified.json.reward.duplicate, false);
  // Re-verify is a safe no-op (no double credit).
  const again = await call(base, `/v1/challenges/${id}/participations/${pid}/verify`, { method: "POST", cookie: owner, body: {}, expect: 200 });
  assert.equal(again.json.duplicate, true);

  // Balance reflects exactly one reward (40), not two.
  const bal = await call(base, `/v1/ecocoin/balance?userId=${ownerId}`, { cookie: owner });
  assert.equal(bal.json.balance, 40);

  // Close then archive the challenge.
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "closed" } });
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "archived" } });
  const archived = await call(base, `/v1/challenges/${id}`, { cookie: owner });
  assert.equal(archived.json.status, "archived");

  // Tenancy: a foreign owner cannot see the challenge.
  const other = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "foreign-chl@b.local", name: "Frn", password: PASS, organizationName: "Foreign Chl" }, expect: 201 })).headers);
  await call(base, `/v1/challenges/${id}`, { cookie: other, expect: 404 });
});

test("challenge reward respects the per-user issuance limit (no over-issuance)", async (t) => {
  const base = await makeApp(t);
  const owner = cookieOf((await call(base, "/v1/auth/register", { method: "POST", body: { email: "limit@b.local", name: "Lmt", password: PASS, organizationName: "Lmt Co" }, expect: 201 })).headers);
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const me = (await call(base, "/v1/auth/me", { cookie: owner })).json;
  const ownerId = me.user.id;

  // Rule whose per-user issuance limit (20) is below the reward amount (40):
  // the first verification must be blocked and issue nothing.
  const rule = await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "limited", title: "Limited", ecoCoinAmount: 40, issuanceLimit: 20 }, expect: 201 });
  const created = await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code: "lim-chl", title: "Limited challenge", rewardRuleId: rule.json.id, maxParticipants: 5 }, expect: 201 });
  const id = created.json.id;
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });

  const part = await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: owner, expect: 201 });
  const v = await call(base, `/v1/challenges/${id}/participations/${part.json.id}/verify`, { method: "POST", cookie: owner, body: {}, expect: 200 });
  // Participation is verified, but the reward is withheld because it would exceed the limit.
  assert.equal(v.json.participation.status, "verified");
  assert.equal(v.json.reward.entry, null);
  assert.equal(v.json.reward.limitReached, true);

  // No EcoCoin was issued; the ledger is empty and the balance is zero.
  const recon = await call(base, "/v1/ecocoin/reconcile", { cookie: owner });
  assert.equal(recon.json.totalBalance, 0);
  const bal = await call(base, `/v1/ecocoin/balance?userId=${ownerId}`, { cookie: owner });
  assert.equal(bal.json.balance, 0);
});

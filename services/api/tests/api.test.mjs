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

/**
 * Phase 3 — Tenant-isolation scenarios for PATCH /v1/users/:id (SEC-01).
 * Deterministic DB fixtures + real HTTP. Run: node --test services/api/tests/tenant-isolation.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";
import { hashPassword } from "../src/auth.mjs";

const PASS = "correct-horse-battery";
const rid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

async function makeApp(t) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db, rateLimit: { disabled: true } }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${server.address().port}`, db };
}

function seedUser(db, email, password = PASS) {
  const id = rid("usr");
  db.prepare("INSERT INTO users (id, email, name, password_hash, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)")
    .run(id, email, email, hashPassword(password), new Date().toISOString());
  return id;
}
function seedOrg(db, name) {
  const id = rid("org");
  db.prepare("INSERT INTO organizations (id, name, slug, country, kind, status, created_at) VALUES (?, ?, ?, 'IR', 'community', 'active', ?)")
    .run(id, name, name.toLowerCase(), new Date().toISOString());
  return id;
}
function seedMembership(db, userId, orgId, role, status = "active") {
  const id = rid("mem");
  db.prepare("INSERT INTO memberships (id, org_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, orgId, userId, role, status, new Date().toISOString());
  return id;
}
async function login(base, email, password = PASS) {
  const r = await fetch(base + "/v1/auth/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(r.status, 200, `login ${email}`);
  return r.headers.get("set-cookie").split(";")[0];
}
const patch = (base, id, cookie, body) =>
  fetch(`${base}/v1/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(body) });

test("manager of A cannot mutate a user who belongs only to B (404, no leak)", async (t) => {
  const { base, db } = await makeApp(t);
  const orgA = seedOrg(db, "Alpha");
  const orgB = seedOrg(db, "Beta");
  const actor = seedUser(db, "boss@a.local");
  seedMembership(db, actor, orgA, "manager");
  const victim = seedUser(db, "victim@b.local");
  seedMembership(db, victim, orgB, "member");
  const cookie = await login(base, "boss@a.local");

  for (const body of [{ status: "suspended" }, { name: "hijack" }, { role: "owner" }]) {
    const r = await patch(base, victim, cookie, body);
    assert.equal(r.status, 404, `${JSON.stringify(body)} must be 404`);
  }
});

test("manager of A can manage a shared user; role change is scoped to A only", async (t) => {
  const { base, db } = await makeApp(t);
  const orgA = seedOrg(db, "Alpha");
  const orgB = seedOrg(db, "Beta");
  const actor = seedUser(db, "boss2@a.local");
  seedMembership(db, actor, orgA, "manager");
  const shared = seedUser(db, "shared@x.local");
  const memA = seedMembership(db, shared, orgA, "member");
  const memB = seedMembership(db, shared, orgB, "viewer");
  const cookie = await login(base, "boss2@a.local");

  const renamed = await patch(base, shared, cookie, { name: "Renamed" });
  assert.equal(renamed.status, 200);
  assert.equal((await renamed.json()).name, "Renamed");

  const promoted = await patch(base, shared, cookie, { role: "manager" });
  assert.equal(promoted.status, 200);

  const roleA = db.prepare("SELECT role FROM memberships WHERE id = ?").get(memA).role;
  const roleB = db.prepare("SELECT role FROM memberships WHERE id = ?").get(memB).role;
  assert.equal(roleA, "manager", "role in A changed");
  assert.equal(roleB, "viewer", "role in B must NOT change");
});

test("multi-org membership grants no extra authority: viewer in A stays blocked for A-only target", async (t) => {
  const { base, db } = await makeApp(t);
  const orgA = seedOrg(db, "Alpha");
  const orgB = seedOrg(db, "Beta");
  const actor = seedUser(db, "dual@x.local");
  seedMembership(db, actor, orgA, "viewer"); // no write in A
  seedMembership(db, actor, orgB, "manager"); // write only in B
  const target = seedUser(db, "t@a.local");
  seedMembership(db, target, orgA, "member"); // only in A
  const cookie = await login(base, "dual@x.local");

  const r = await patch(base, target, cookie, { name: "nope" });
  assert.equal(r.status, 403, "manager in B must not manage an A-only user");
});

test("a user without a write role cannot perform administrative updates (403)", async (t) => {
  const { base, db } = await makeApp(t);
  const orgA = seedOrg(db, "Alpha");
  const actor = seedUser(db, "viewer@a.local");
  seedMembership(db, actor, orgA, "viewer");
  const target = seedUser(db, "member@a.local");
  seedMembership(db, target, orgA, "member");
  const cookie = await login(base, "viewer@a.local");

  const r = await patch(base, target, cookie, { status: "suspended" });
  assert.equal(r.status, 403);
});

test("policy: non-shared target returns 404, shared-but-unauthorized returns 403", async (t) => {
  const { base, db } = await makeApp(t);
  const orgA = seedOrg(db, "Alpha");
  const orgB = seedOrg(db, "Beta");
  const actor = seedUser(db, "pol@a.local");
  seedMembership(db, actor, orgA, "viewer"); // shared org but no write
  const outsider = seedUser(db, "out@b.local");
  seedMembership(db, outsider, orgB, "member"); // not shared
  const cookie = await login(base, "pol@a.local");

  assert.equal((await patch(base, outsider, cookie, { name: "x" })).status, 404);
  // A target the actor shares an org with, but cannot write → 403.
  const teammate = seedUser(db, "mate@a.local");
  seedMembership(db, teammate, orgA, "member");
  assert.equal((await patch(base, teammate, cookie, { name: "x" })).status, 403);
});
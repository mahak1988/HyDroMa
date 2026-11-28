/**
 * Phase 3 — Rate limiting (SEC-03) verification.
 * In-process per-IP limiter; thresholds injected via createApp options (no prod
 * bypass). Run: node --test services/api/tests/rate-limit.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";
import { hashPassword } from "../src/auth.mjs";

const PASS = "correct-horse-battery";

async function makeApp(t, rateLimit) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db, rateLimit }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${server.address().port}`, db };
}

function seedUser(db, email) {
  const id = `usr_${email.replace(/[^a-z0-9]/giu, "")}`;
  db.prepare("INSERT INTO users (id, email, name, password_hash, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)").run(
    id, email, "Seed", hashPassword(PASS), new Date().toISOString(),
  );
  return id;
}

async function post(base, path, body) {
  return fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("login: failed attempts are throttled after the threshold with Retry-After", async (t) => {
  const { base, db } = await makeApp(t, { max: 3, windowMs: 60_000 });
  seedUser(db, "alice@rl.local");
  for (let i = 0; i < 3; i += 1) {
    const r = await post(base, "/v1/auth/login", { email: "alice@rl.local", password: "wrong-pass-x" });
    assert.equal(r.status, 401, `attempt ${i} should be 401`);
  }
  const blocked = await post(base, "/v1/auth/login", { email: "alice@rl.local", password: "wrong-pass-x" });
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get("retry-after"), "429 must carry Retry-After");
  const body = await blocked.json();
  assert.equal(body.error.code, "rate_limited");
});

test("login: a successful login resets the failure counter", async (t) => {
  const { base, db } = await makeApp(t, { max: 3, windowMs: 60_000 });
  seedUser(db, "bob@rl.local");
  await post(base, "/v1/auth/login", { email: "bob@rl.local", password: "wrong-pass-x" });
  await post(base, "/v1/auth/login", { email: "bob@rl.local", password: "wrong-pass-x" });
  const ok = await post(base, "/v1/auth/login", { email: "bob@rl.local", password: PASS });
  assert.equal(ok.status, 200, "correct password succeeds below threshold");
  // Counter reset: two more failures must still be 401, not 429.
  for (let i = 0; i < 2; i += 1) {
    const r = await post(base, "/v1/auth/login", { email: "bob@rl.local", password: "wrong-pass-x" });
    assert.equal(r.status, 401);
  }
});

test("login: the window resets after it elapses (no permanent lockout)", async (t) => {
  const { base, db } = await makeApp(t, { max: 2, windowMs: 300 });
  seedUser(db, "carol@rl.local");
  await post(base, "/v1/auth/login", { email: "carol@rl.local", password: "wrong-pass-x" });
  await post(base, "/v1/auth/login", { email: "carol@rl.local", password: "wrong-pass-x" });
  const blocked = await post(base, "/v1/auth/login", { email: "carol@rl.local", password: "wrong-pass-x" });
  assert.equal(blocked.status, 429);
  await new Promise((r) => setTimeout(r, 400)); // window (300ms) elapses
  const after = await post(base, "/v1/auth/login", { email: "carol@rl.local", password: "wrong-pass-x" });
  assert.equal(after.status, 401, "window reset clears the throttle");
});

test("register: attempts are limited per IP regardless of email variation", async (t) => {
  const { base } = await makeApp(t, { max: 2, windowMs: 60_000 });
  const r1 = await post(base, "/v1/auth/register", { email: "u1@rl.local", name: "U1", password: PASS, organizationName: "O1" });
  const r2 = await post(base, "/v1/auth/register", { email: "u2@rl.local", name: "U2", password: PASS, organizationName: "O2" });
  assert.equal(r1.status, 201);
  assert.equal(r2.status, 201);
  // Third attempt with a different email is still blocked (keyed by IP, not email).
  const r3 = await post(base, "/v1/auth/register", { email: "u3@rl.local", name: "U3", password: PASS, organizationName: "O3" });
  assert.equal(r3.status, 429);
  assert.equal((await r3.json()).error.code, "rate_limited");
});

test("rate limit: 429 is generic and does not reveal account existence", async (t) => {
  const { base, db } = await makeApp(t, { max: 1, windowMs: 60_000 });
  seedUser(db, "dave@rl.local");
  await post(base, "/v1/auth/login", { email: "dave@rl.local", password: "wrong-pass-x" }); // count 1
  const known = await post(base, "/v1/auth/login", { email: "dave@rl.local", password: "wrong-pass-x" });
  const unknown = await post(base, "/v1/auth/login", { email: "nobody@rl.local", password: "wrong-pass-x" });
  assert.equal(known.status, 429);
  assert.equal(unknown.status, 429);
  // Same generic body for both — no hint about which account exists.
  assert.equal((await known.json()).error.code, (await unknown.json()).error.code);
});

test("rate limit: invalid config fails SAFE (NaN max falls back to default, never fail-open)", async (t) => {
  // max: NaN must not disable limiting (which would be a fail-open). It sanitises
  // to the secure default (20): the 21st attempt is blocked.
  const { base, db } = await makeApp(t, { max: Number("not-a-number"), windowMs: 60_000 });
  seedUser(db, "frank@rl.local");
  let last;
  for (let i = 0; i < 20; i += 1) {
    last = await post(base, "/v1/auth/login", { email: "frank@rl.local", password: "wrong-pass-x" });
    assert.equal(last.status, 401, `attempt ${i} should be 401`);
  }
  const blocked = await post(base, "/v1/auth/login", { email: "frank@rl.local", password: "wrong-pass-x" });
  assert.equal(blocked.status, 429, "invalid config must still throttle (fail-safe)");
});

test("rate limit: can be disabled explicitly (e.g. trusted test env)", async (t) => {
  const { base, db } = await makeApp(t, { max: 1, windowMs: 60_000, disabled: true });
  seedUser(db, "erin@rl.local");
  for (let i = 0; i < 5; i += 1) {
    const r = await post(base, "/v1/auth/login", { email: "erin@rl.local", password: "wrong-pass-x" });
    assert.equal(r.status, 401, "disabled limiter never returns 429");
  }
});
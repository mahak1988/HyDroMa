/**
 * Phase 3 — CORS (SEC-02) and CSRF/Origin (SEC-06) verification.
 * Isolated in-memory SQLite per test. Run: node --test services/api/tests/cors.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const ALLOWED = "http://localhost:5180";
const EVIL = "http://evil.example";

async function makeApp(t) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${server.address().port}`;
}

async function raw(base, path, { method = "GET", origin, body } = {}) {
  const headers = {};
  if (origin) headers.origin = origin;
  if (body) headers["content-type"] = "application/json";
  return fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

test("CORS: allowed origin is reflected with credentials", async (t) => {
  const base = await makeApp(t);
  const res = await raw(base, "/v1/models", { origin: ALLOWED });
  assert.equal(res.headers.get("access-control-allow-origin"), ALLOWED);
  assert.equal(res.headers.get("access-control-allow-credentials"), "true");
});

test("CORS: disallowed origin gets no allow-origin header (browser blocks)", async (t) => {
  const base = await makeApp(t);
  const res = await raw(base, "/v1/models", { origin: EVIL });
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("CORS: request without Origin is unaffected", async (t) => {
  const base = await makeApp(t);
  const res = await raw(base, "/v1/models");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("CORS: preflight advertises methods/headers and is not credentialed for a foreign origin", async (t) => {
  const base = await makeApp(t);
  const ok = await raw(base, "/v1/auth/login", { method: "OPTIONS", origin: ALLOWED });
  assert.equal(ok.status, 204);
  assert.match(ok.headers.get("access-control-allow-methods") ?? "", /POST/u);
  assert.match(ok.headers.get("access-control-allow-headers") ?? "", /content-type/u);

  const evil = await raw(base, "/v1/auth/login", { method: "OPTIONS", origin: EVIL });
  assert.equal(evil.status, 204);
  assert.equal(evil.headers.get("access-control-allow-origin"), null);
});

test("CORS: wildcard config never combines with credentials", async (t) => {
  const prev = process.env.NOJIN_ORIGINS;
  process.env.NOJIN_ORIGINS = "*";
  try {
    const base = await makeApp(t);
    const res = await raw(base, "/v1/models", { origin: EVIL });
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.equal(res.headers.get("access-control-allow-credentials"), null);
  } finally {
    if (prev === undefined) delete process.env.NOJIN_ORIGINS; else process.env.NOJIN_ORIGINS = prev;
  }
});

test("CSRF: cross-origin state-changing request is rejected (403 origin_forbidden)", async (t) => {
  const base = await makeApp(t);
  const res = await raw(base, "/v1/auth/login", { method: "POST", origin: EVIL, body: { email: "a@b.local", password: PASS } });
  assert.equal(res.status, 403);
  assert.equal((await res.json()).error.code, "origin_forbidden");
});

test("CSRF: same-origin and no-Origin mutations are allowed through", async (t) => {
  const base = await makeApp(t);
  const same = await raw(base, "/v1/auth/login", { method: "POST", origin: ALLOWED, body: { email: "a@b.local", password: PASS } });
  assert.notEqual(same.status, 403); // 401 invalid creds is fine; the point is not 403 origin
  const none = await raw(base, "/v1/auth/login", { method: "POST", body: { email: "a@b.local", password: PASS } });
  assert.notEqual(none.status, 403);
});

test("CSRF: PUT/PATCH/DELETE cross-origin are all rejected before auth", async (t) => {
  const base = await makeApp(t);
  for (const method of ["PUT", "PATCH", "DELETE"]) {
    const res = await raw(base, "/v1/auth/login", { method, origin: EVIL, body: {} });
    // 403 origin_forbidden is returned before authentication, for every verb.
    assert.equal(res.status, 403, `${method} must be blocked cross-origin`);
    assert.equal((await res.json()).error.code, "origin_forbidden");
  }
});

test("CSRF: safe methods (GET) are never blocked by Origin", async (t) => {
  const base = await makeApp(t);
  const res = await raw(base, "/v1/models", { origin: EVIL });
  assert.notEqual(res.status, 403);
  assert.equal(res.status, 200);
});
/**
 * Phase 3 — Session cookie `Secure` flag (SEC-05).
 * Default (http dev) keeps Secure off; HTTPS/forced config adds it.
 * Run: node --test services/api/tests/cookie.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";

async function makeApp(t, options = {}) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db, rateLimit: { disabled: true }, ...options }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${server.address().port}`;
}

async function register(base) {
  return fetch(base + "/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "c@cookie.local", name: "Cookie User", password: PASS, organizationName: "Cookie Co" }),
  });
}

test("cookie: Secure is absent on plain-http dev by default", async (t) => {
  const base = await makeApp(t);
  const res = await register(base);
  const setCookie = res.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/u);
  assert.match(setCookie, /SameSite=Lax/u);
  assert.doesNotMatch(setCookie, /;\s*Secure/u);
});

test("cookie: Secure is added when the app is configured for HTTPS", async (t) => {
  const base = await makeApp(t, { cookieSecure: true });
  const res = await register(base);
  assert.match(res.headers.get("set-cookie"), /;\s*Secure/u);
});

test("cookie: spoofed x-forwarded-proto is ignored unless a proxy is trusted", async (t) => {
  // No trusted proxy → a client-supplied x-forwarded-proto:https must NOT add Secure.
  const base = await makeApp(t);
  const spoof = await fetch(base + "/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-proto": "https" },
    body: JSON.stringify({ email: "s@cookie.local", name: "Spoof User", password: PASS, organizationName: "Spoof Co" }),
  });
  assert.doesNotMatch(spoof.headers.get("set-cookie"), /;\s*Secure/u);

  // With a trusted proxy, x-forwarded-proto:https is honoured → Secure added.
  const prev = process.env.NOJIN_TRUST_PROXY;
  process.env.NOJIN_TRUST_PROXY = "true";
  try {
    const base2 = await makeApp(t);
    const trusted = await fetch(base2 + "/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-proto": "https" },
      body: JSON.stringify({ email: "t@cookie.local", name: "Trusted User", password: PASS, organizationName: "Trusted Co" }),
    });
    assert.match(trusted.headers.get("set-cookie"), /;\s*Secure/u);
  } finally {
    if (prev === undefined) delete process.env.NOJIN_TRUST_PROXY; else process.env.NOJIN_TRUST_PROXY = prev;
  }
});

test("cookie: logout clears the cookie with matching Secure attribute", async (t) => {
  const base = await makeApp(t, { cookieSecure: true });
  await register(base);
  const res = await fetch(base + "/v1/auth/logout", { method: "POST" });
  const setCookie = res.headers.get("set-cookie");
  assert.match(setCookie, /Max-Age=0/u);
  assert.match(setCookie, /;\s*Secure/u);
});
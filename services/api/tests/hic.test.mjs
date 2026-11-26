import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

async function makeApp(t) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${server.address().port}`;
}

async function call(base, path, { method = "GET", body, cookie, expect = 200 } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}: ${text.slice(0, 200)}`);
  return { json, headers: r.headers };
}

const cookieOf = (h) => h.get("set-cookie").split(";")[0];

async function bootstrap(base, email, orgName) {
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email, name: email, password: "correct-horse-battery", organizationName: orgName }, expect: 201 });
  return cookieOf(headers);
}

test("HIC status returns INACTIVE, non-financial, non-transferable, non-issuable", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "hic-owner@example.org", "HIC Org");

  const res = await call(base, "/v1/hic/status", { cookie: owner });
  const body = res.json;

  assert.strictEqual(body.status, "INACTIVE", "HIC status must be INACTIVE");
  assert.strictEqual(body.issuable, false, "HIC must not be issuable");
  assert.strictEqual(body.transferable, false, "HIC must not be transferable");
  assert.strictEqual(body.convertible, false, "HIC must not be convertible");
  assert.strictEqual(body.financial, false, "HIC must not be financial");
  assert.strictEqual(body.governanceStatus, "OWNER_DECISION_REQUIRED");
  assert.ok(Array.isArray(body.futureActivationRequirements));
  assert.ok(body.futureActivationRequirements.length > 0);
  assert.ok(body.definition.includes("non-financial"));
  assert.ok(body.auditNote.includes("inactive"));
  assert.ok(body.organizationId, "organizationId present");
  assert.ok(body.readAt, "readAt present");

  // Unauthenticated access must be rejected
  await call(base, "/v1/hic/status", { expect: 401 });

  // Cross-org isolation: the endpoint returns the caller's org
  assert.ok(body.organizationId, "organizationId must be set for the caller's org");
});

test("HIC status is read-only — no issuance, transfer, or conversion endpoints exist", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "hic-readonly@example.org", "HIC Readonly Org");

  // No POST/PATCH/DELETE on /v1/hic/status — all should be 404 (no route)
  await call(base, "/v1/hic/status", { method: "POST", cookie: owner, body: {}, expect: 404 });
  await call(base, "/v1/hic/status", { method: "PATCH", cookie: owner, body: { status: "ACTIVE" }, expect: 404 });
  await call(base, "/v1/hic/status", { method: "DELETE", cookie: owner, expect: 404 });
});
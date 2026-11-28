/**
 * Phase 3.64 — Rewards & Challenges / EcoCoin foundation API tests.
 * Real in-memory SQLite per test; disposable identities; no secrets logged.
 *
 * Covers: reward-rule config + RBAC, challenge lifecycle state machine,
 * participation + duplicate/capacity controls, server-verified reward issuance,
 * ledger idempotency/immutability, compensating corrections, reconciliation,
 * issuance limits, authorization and tenancy isolation.
 *
 * Run: node --test services/api/tests/rewards.test.mjs
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
  const json = text ? JSON.parse(text) : null;
  assert.equal(response.status, expect, `${method} ${path} -> ${response.status}: ${text.slice(0, 240)}`);
  return { json, headers: response.headers };
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

test("reward rules: config CRUD with RBAC, code uniqueness and amount validation", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@rw.local", "Reward Co");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const member = await invite(base, owner, org, "mem@rw.local", "member");

  // Member cannot create a rule.
  await call(base, "/v1/rewards/rules", { method: "POST", cookie: member, body: { code: "water-save", title: "Water saving" }, expect: 403 });

  // Invalid amount rejected.
  await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { organizationId: org, code: "neg", title: "Neg", ecoCoinAmount: -5 }, expect: 422 });

  const created = await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { organizationId: org, code: "water-save", title: "Water saving", ecoCoinAmount: 50, issuanceLimit: 100 }, expect: 201 });
  assert.equal(created.json.ecoCoinAmount, 50);
  assert.equal(created.json.issuanceLimit, 100);

  // Duplicate code is refused.
  await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { organizationId: org, code: "water-save", title: "Dup" }, expect: 409 });

  const patched = await call(base, `/v1/rewards/rules/${created.json.id}`, { method: "PATCH", cookie: owner, body: { ecoCoinAmount: 75, status: "inactive" } });
  assert.equal(patched.json.ecoCoinAmount, 75);
  assert.equal(patched.json.status, "inactive");

  const list = await call(base, "/v1/rewards/rules", { cookie: owner });
  assert.equal(list.json.total, 1);
});

test("challenge lifecycle: draft→published→closed→archived, illegal edges and forced status rejected", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@chl.local", "Chal Co");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const created = await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { organizationId: org, code: "plant-trees", title: "Plant 100 trees", status: "published" }, expect: 201 });
  assert.equal(created.json.status, "draft", "client status is ignored; starts draft");
  const id = created.json.id;

  // Forced status write is rejected.
  await call(base, `/v1/challenges/${id}`, { method: "PATCH", cookie: owner, body: { status: "published" }, expect: 409 });

  // Illegal skip draft→closed rejected with allowed set.
  const bad = await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "closed" }, expect: 409 });
  assert.deepEqual(bad.json.error.details.allowed, ["published"]);

  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "closed" } });
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "archived" } });
  // Archived is terminal.
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "published" }, expect: 409 });
});

test("participation: requires published, duplicate refused, capacity enforced, viewer may join", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@ptp.local", "Ptp Co");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const viewer = await invite(base, owner, org, "view@ptp.local", "viewer");

  const created = await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { organizationId: org, code: "recycle", title: "Recycle drive", maxParticipants: 1 }, expect: 201 });
  const id = created.json.id;

  // Cannot join a draft.
  await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: viewer, expect: 409 });
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });

  // Viewer joins.
  const joined = await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: viewer, expect: 201 });
  assert.equal(joined.json.status, "joined");

  // Duplicate participation refused.
  await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: viewer, expect: 409 });

  // Capacity (max 1) reached for a second participant.
  const other = await invite(base, owner, org, "second@ptp.local", "member");
  await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: other, expect: 409 });
});

test("verified participation issues an idempotent reward; re-verify does not double-credit", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@vrf.local", "Verify Co");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const member = await invite(base, owner, org, "worker@vrf.local", "member");

  const rule = await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { organizationId: org, code: "verify-reward", title: "Verified reward", ecoCoinAmount: 30 }, expect: 201 });
  const created = await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { organizationId: org, code: "audit-stream", title: "Audit a stream", rewardRuleId: rule.json.id, completionCriteria: "Submit 3 readings" }, expect: 201 });
  const id = created.json.id;
  await call(base, `/v1/challenges/${id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });

  await call(base, `/v1/challenges/${id}/participate`, { method: "POST", cookie: member, expect: 201 });
  const participations = (await call(base, `/v1/challenges/${id}/participations`, { cookie: owner })).json.items;
  const pid = participations[0].id;

  // Member cannot verify.
  await call(base, `/v1/challenges/${id}/participations/${pid}/verify`, { method: "POST", cookie: member, body: {}, expect: 403 });

  const verified = await call(base, `/v1/challenges/${id}/participations/${pid}/verify`, { method: "POST", cookie: owner, body: { verification: "3 readings checked" } });
  assert.equal(verified.json.participation.status, "verified");
  assert.equal(verified.json.reward.entry.amount, 30);
  assert.equal(verified.json.reward.duplicate, false);

  // Re-verify is a safe no-op (no new credit).
  const again = await call(base, `/v1/challenges/${id}/participations/${pid}/verify`, { method: "POST", cookie: owner, body: {} });
  assert.equal(again.json.duplicate, true);
  assert.equal(again.json.reward, null);

  // Exactly one ledger entry and the correct balance.
  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json.items;
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].source, "challenge_reward");
  const summary = (await call(base, "/v1/ecocoin/summary", { cookie: member })).json;
  assert.equal(summary.balance, 30);
  assert.equal(summary.totalCredits, 30);
  assert.equal(summary.entryCount, 1);
});

test("issuance limit caps repeated rewards for the same rule/user", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@lim.local", "Limit Co");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;

  const rule = await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { organizationId: org, code: "capped", title: "Capped", ecoCoinAmount: 10, issuanceLimit: 10 }, expect: 201 });

  const makeChallenge = async (code) => {
    const c = await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { organizationId: org, code, title: code, rewardRuleId: rule.json.id }, expect: 201 });
    await call(base, `/v1/challenges/${c.json.id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });
    await call(base, `/v1/challenges/${c.json.id}/participate`, { method: "POST", cookie: owner, expect: 201 });
    const pid = (await call(base, `/v1/challenges/${c.json.id}/participations`, { cookie: owner })).json.items[0].id;
    return { id: c.json.id, pid };
  };

  const c1 = await makeChallenge("cap-one");
  const r1 = await call(base, `/v1/challenges/${c1.id}/participations/${c1.pid}/verify`, { method: "POST", cookie: owner, body: {} });
  assert.equal(r1.json.reward.entry.amount, 10);

  const c2 = await makeChallenge("cap-two");
  const r2 = await call(base, `/v1/challenges/${c2.id}/participations/${c2.pid}/verify`, { method: "POST", cookie: owner, body: {} });
  assert.equal(r2.json.reward.limitReached, true, "second reward exceeds the per-user issuance limit");
  assert.equal(r2.json.reward.entry, null);

  const summary = (await call(base, "/v1/ecocoin/summary", { cookie: owner })).json;
  assert.equal(summary.balance, 10);
});

test("ledger integrity: read-only, idempotent reference, compensating correction, reconciliation", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@led.local", "Ledger Co");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const member = await invite(base, owner, org, "m@led.local", "member");
  const memberId = (await call(base, "/v1/users", { cookie: owner })).json.items.find((u) => u.email === "m@led.local").id;

  // There is no API path to mutate or delete ledger history.
  await call(base, "/v1/ecocoin/ledger", { method: "PATCH", cookie: owner, body: { amount: 1 }, expect: 404 });
  await call(base, "/v1/ecocoin/ledger", { method: "DELETE", cookie: owner, expect: 404 });

  // A member cannot read the org ledger nor post adjustments.
  await call(base, "/v1/ecocoin/ledger", { cookie: member, expect: 403 });
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: member, body: { userId: memberId, amount: 5, entryType: "credit", reason: "self mint" }, expect: 403 });

  // Owner posts a credit then a compensating debit (correction, not a rewrite).
  const credit = await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId: memberId, amount: 40, entryType: "credit", reason: "welcome grant" }, expect: 201 });
  assert.equal(credit.json.entry.entryType, "credit");
  const debit = await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId: memberId, amount: 15, entryType: "debit", reason: "correct welcome grant" }, expect: 201 });
  assert.equal(debit.json.entry.entryType, "debit");

  const balance = (await call(base, `/v1/ecocoin/balance?userId=${memberId}`, { cookie: owner })).json.balance;
  assert.equal(balance, 25);

  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json.items;
  assert.equal(ledger.length, 2, "history is append-only: two entries, no rewrite");
  const references = new Set(ledger.map((e) => e.reference));
  assert.equal(references.size, 2, "each entry has a unique reference");

  const recon = (await call(base, "/v1/ecocoin/reconcile", { cookie: owner })).json;
  assert.equal(recon.totalBalance, 25);
  assert.equal(recon.entryCount, 2);
  assert.deepEqual(recon.anomalies, []);

  // A member cannot reconcile.
  await call(base, "/v1/ecocoin/reconcile", { cookie: member, expect: 403 });
});

test("tenancy: a foreign organization cannot see challenges, rules or ledger", async (t) => {
  const base = await makeApp(t);
  const a = await bootstrap(base, "a@ten.local", "Tenant A");
  const orgA = (await call(base, "/v1/organizations", { cookie: a })).json.items[0].id;
  const b = await bootstrap(base, "b@ten.local", "Tenant B");

  const rule = await call(base, "/v1/rewards/rules", { method: "POST", cookie: a, body: { organizationId: orgA, code: "a-rule", title: "A rule" }, expect: 201 });
  const chal = await call(base, "/v1/challenges", { method: "POST", cookie: a, body: { organizationId: orgA, code: "a-chal", title: "A challenge", rewardRuleId: rule.json.id }, expect: 201 });

  // B sees an empty catalogue and cannot fetch A's records by id.
  assert.equal((await call(base, "/v1/challenges", { cookie: b })).json.total, 0);
  await call(base, `/v1/challenges/${chal.json.id}`, { cookie: b, expect: 404 });
  // B's own (empty) ledger never leaks A's entries.
  const bLedger = await call(base, `/v1/ecocoin/ledger`, { cookie: b });
  assert.equal(bLedger.json.total, 0);
});
/**
 * Phase 3.65-A — EcoCoin ledger integrity, concurrency, idempotency, reconciliation.
 * Real service + real SQLite (in-memory), disposable identities. No mocks.
 * Run: node --test services/api/tests/ecocoin-ledger.test.mjs
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
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email, name: email, password: PASS, organizationName: orgName }, expect: 201 });
  return cookieOf(headers);
}

async function setupChallenge(base, owner) {
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const rule = (await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "rule1", title: "Rule", ecoCoinAmount: 5, issuanceLimit: 100 }, expect: 201 })).json;
  const ch = (await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code: "ch1", title: "Challenge", rewardRuleId: rule.id }, expect: 201 })).json;
  await call(base, `/v1/challenges/${ch.id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });
  const p = (await call(base, `/v1/challenges/${ch.id}/participate`, { method: "POST", cookie: owner, expect: 201 })).json;
  return { org, challengeId: ch.id, participationId: p.id };
}

test("concurrent verify issues exactly one credit (idempotent under concurrency)", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own@eco.local", "Eco Org");
  const { challengeId, participationId } = await setupChallenge(base, owner);

  const results = await Promise.all(
    Array.from({ length: 10 }, () => fetch(`${base}/v1/challenges/${challengeId}/participations/${participationId}/verify`, { method: "POST", headers: { cookie: owner } })),
  );
  const statuses = results.map((r) => r.status);
  assert.ok(statuses.every((s) => s === 200), `all verify calls succeed: ${statuses}`);

  const summary = (await call(base, "/v1/ecocoin/summary", { cookie: owner })).json;
  assert.equal(summary.balance, 5, "exactly one credit of 5");
  assert.equal(summary.totalCredits, 5);

  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json;
  assert.equal(ledger.total, 1, "one ledger entry despite 10 concurrent verifies");
});

test("sequential re-verification is a safe no-op (no duplicate credit)", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own2@eco.local", "Eco Org 2");
  const { challengeId, participationId } = await setupChallenge(base, owner);
  const first = await call(base, `/v1/challenges/${challengeId}/participations/${participationId}/verify`, { method: "POST", cookie: owner });
  assert.equal(first.json.reward.duplicate, false);
  const second = await call(base, `/v1/challenges/${challengeId}/participations/${participationId}/verify`, { method: "POST", cookie: owner });
  assert.equal(second.json.duplicate, true);
  assert.equal((await call(base, "/v1/ecocoin/summary", { cookie: owner })).json.balance, 5);
});

test("reconciliation reconstructs balances and detects a negative anomaly; ledger is read-only", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own3@eco.local", "Eco Org 3");
  const { challengeId, participationId } = await setupChallenge(base, owner);
  await call(base, `/v1/challenges/${challengeId}/participations/${participationId}/verify`, { method: "POST", cookie: owner });

  const rec = (await call(base, "/v1/ecocoin/reconcile", { cookie: owner })).json;
  assert.equal(rec.totalBalance, 5);
  assert.deepEqual(rec.anomalies, []);

  const me = (await call(base, "/v1/auth/me", { cookie: owner })).json;
  const userId = me.user.id;
  // Compensating debit larger than the balance → negative → anomaly (history preserved).
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: 10, entryType: "debit", reason: "correction" }, expect: 201 });
  const rec2 = (await call(base, "/v1/ecocoin/reconcile", { cookie: owner })).json;
  assert.ok(rec2.anomalies.includes(userId), "negative balance flagged");
  assert.equal(rec2.totalBalance, -5);
  // Original credit entry still present (no rewrite).
  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json;
  assert.ok(ledger.items.some((e) => e.entryType === "credit" && e.amount === 5));

  // No application route mutates/deletes a ledger entry.
  const entryId = ledger.items[0].id;
  await call(base, `/v1/ecocoin/ledger/${entryId}`, { method: "PATCH", cookie: owner, body: { amount: 1 }, expect: 404 });
  await call(base, `/v1/ecocoin/ledger/${entryId}`, { method: "DELETE", cookie: owner, expect: 404 });
});

test("RBAC + tenant isolation: ledger read is write-gated and org-scoped", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own4@eco.local", "Eco Org 4");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  // Viewer cannot read the ledger.
  const viewer = await (async () => {
    const inv = (await call(base, `/v1/organizations/${org}/members`, { method: "POST", cookie: owner, body: { email: "v@eco.local", role: "viewer" }, expect: 201 })).json;
    const r = await fetch(base + "/v1/auth/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: inv.inviteToken, password: "disposable-pass-1" }) });
    return r.headers.get("set-cookie").split(";")[0];
  })();
  await call(base, "/v1/ecocoin/ledger", { cookie: viewer, expect: 403 });

  // A foreign owner sees only their own (empty) ledger, never org 4's.
  const other = await bootstrap(base, "other@eco.local", "Other Org");
  const otherLedger = (await call(base, "/v1/ecocoin/ledger", { cookie: other })).json;
  assert.equal(otherLedger.total, 0);
});
test("ledger: real pagination, sorting and filters (type, source, challenge, date, user)", async (t) => {
  const base = await makeApp(t);
  const owner = await bootstrap(base, "own5@eco.local", "Eco Org 5");
  const me = (await call(base, "/v1/auth/me", { cookie: owner })).json;
  const userId = me.user.id;

  // Three distinct credit entries + one debit (real persisted rows).
  for (let i = 1; i <= 3; i += 1) {
    await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: i, entryType: "credit", reason: `credit-${i}` }, expect: 201 });
  }
  await call(base, "/v1/ecocoin/adjustments", { method: "POST", cookie: owner, body: { userId, amount: 1, entryType: "debit", reason: "debit-1" }, expect: 201 });

  // Pagination: limit=2 yields a real nextCursor and a truthful total.
  const page1 = (await call(base, "/v1/ecocoin/ledger?limit=2", { cookie: owner })).json;
  assert.equal(page1.items.length, 2, "first page has 2 rows");
  assert.equal(page1.total, 4, "total reflects all rows");
  assert.ok(page1.nextCursor, "nextCursor present when more rows exist");
  const page2 = (await call(base, `/v1/ecocoin/ledger?limit=2&cursor=${encodeURIComponent(page1.nextCursor)}`, { cookie: owner })).json;
  assert.equal(page2.items.length, 2, "second page has the remaining rows");
  assert.equal(page2.nextCursor, null, "no cursor after the last page");
  const ids = new Set([...page1.items, ...page2.items].map((e) => e.id));
  assert.equal(ids.size, 4, "pagination covers every row exactly once");

  // Sorting is real and reversible.
  const desc = (await call(base, "/v1/ecocoin/ledger?sort=desc&limit=1", { cookie: owner })).json.items[0];
  const asc = (await call(base, "/v1/ecocoin/ledger?sort=asc&limit=1", { cookie: owner })).json.items[0];
  assert.notEqual(desc.id, asc.id, "asc and desc return different first rows");

  // Type filter.
  const credits = (await call(base, "/v1/ecocoin/ledger?entryType=credit", { cookie: owner })).json;
  assert.ok(credits.items.every((e) => e.entryType === "credit"), "only credits returned");
  const debits = (await call(base, "/v1/ecocoin/ledger?entryType=debit", { cookie: owner })).json;
  assert.ok(debits.items.every((e) => e.entryType === "debit"), "only debits returned");
  assert.equal(debits.total, 1);

  // Source filter.
  const bySource = (await call(base, "/v1/ecocoin/ledger?source=admin_adjustment", { cookie: owner })).json;
  assert.equal(bySource.total, 4, "all adjustments share the admin_adjustment source");

  // User filter (write role may scope to a member).
  const byUser = (await call(base, `/v1/ecocoin/ledger?userId=${encodeURIComponent(userId)}`, { cookie: owner })).json;
  assert.equal(byUser.total, 4);

  // Date filter: a date-only `from` today includes every entry created today.
  const today = new Date().toISOString().slice(0, 10);
  const fromToday = (await call(base, `/v1/ecocoin/ledger?from=${today}`, { cookie: owner })).json;
  assert.equal(fromToday.total, 4, "from=today includes today's entries");
  const future = (await call(base, `/v1/ecocoin/ledger?from=2999-01-01`, { cookie: owner })).json;
  assert.equal(future.total, 0, "a future from-date yields no rows");

  // Challenge filter: a verified challenge issues exactly one linked entry.
  const { challengeId, participationId } = await setupChallenge(base, owner);
  await call(base, `/v1/challenges/${challengeId}/participations/${participationId}/verify`, { method: "POST", cookie: owner });
  const byChallenge = (await call(base, `/v1/ecocoin/ledger?challengeId=${encodeURIComponent(challengeId)}`, { cookie: owner })).json;
  assert.equal(byChallenge.total, 1, "challenge filter isolates the challenge reward");
  assert.equal(byChallenge.items[0].challengeId, challengeId);
});

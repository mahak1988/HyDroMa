/**
 * Phase 3.66 — integrated challenge → evidence → review → reward workflow.
 * Real service + real SQLite (in-memory). No mocks.
 * Run: node --test services/api/tests/challenge-workflow.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const mk = async (t) => {
  const db = openDatabase(":memory:");
  const s = createServer(createApp({ db }));
  t.after(() => { s.closeAllConnections(); s.close(); });
  s.unref();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${s.address().port}`;
};
async function call(base, path, { method = "GET", body, cookie, expect = 200 } = {}) {
  const r = await fetch(base + path, { method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}: ${text.slice(0, 160)}`);
  return { json, headers: r.headers };
}
const cookieOf = (h) => h.get("set-cookie").split(";")[0];
async function bootstrap(base, email, org) {
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email, name: email, password: PASS, organizationName: org }, expect: 201 });
  return cookieOf(headers);
}
async function inviteMember(base, owner, orgId, email) {
  const inv = (await call(base, `/v1/organizations/${orgId}/members`, { method: "POST", cookie: owner, body: { email, role: "member" }, expect: 201 })).json;
  const r = await fetch(base + "/v1/auth/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: inv.inviteToken, password: "disposable-pass-1" }) });
  return r.headers.get("set-cookie").split(";")[0];
}

async function publishChallenge(base, owner, code) {
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const rule = (await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: `rule-${code}`, title: "Rule", ecoCoinAmount: 5, issuanceLimit: 100 }, expect: 201 })).json;
  const ch = (await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code, title: "Ch", rewardRuleId: rule.id }, expect: 201 })).json;
  await call(base, `/v1/challenges/${ch.id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });
  return { org, challengeId: ch.id };
}

test("full workflow: join → evidence → approve issues once; repeat approve no-op", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "admin@wf.local", "WF Org");
  const { org, challengeId } = await publishChallenge(base, owner, "wf1");
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: owner, body: { organizationId: org, name: "Field A" }, expect: 201 })).json;
  const member = await inviteMember(base, owner, org, "member@wf.local");

  const p = (await call(base, `/v1/challenges/${challengeId}/participate`, { method: "POST", cookie: member, expect: 201 })).json;
  // Evidence linked to a real farm in the same org.
  await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/evidence`, { method: "POST", cookie: member, body: { evidenceType: "photo", sourceType: "farms", sourceId: String(farm.id), description: "Irrigated the plot" }, expect: 201 });

  const approve = await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", cookie: owner, body: { decision: "approve" } });
  assert.equal(approve.json.reward.entry.amount, 5);
  assert.equal(approve.json.participation.status, "approved");

  // Repeat approval → no second reward.
  const again = await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", cookie: owner, body: { decision: "approve" } });
  assert.equal(again.json.duplicate, true);
  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json;
  assert.equal(ledger.items.filter((e) => e.source === "challenge_reward").length, 1);
});

test("reject path issues no reward; unauthorized review/evidence blocked; bad source rejected", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "admin2@wf.local", "WF Org 2");
  const { org, challengeId } = await publishChallenge(base, owner, "wf2");
  const member = await inviteMember(base, owner, org, "member2@wf.local");
  const p = (await call(base, `/v1/challenges/${challengeId}/participate`, { method: "POST", cookie: member, expect: 201 })).json;

  // Member cannot review.
  await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", cookie: member, body: { decision: "approve" }, expect: 403 });
  // Approve without evidence → 409.
  await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", cookie: owner, body: { decision: "approve" }, expect: 409 });
  // Bad source reference → 404.
  await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/evidence`, { method: "POST", cookie: member, body: { evidenceType: "note", sourceType: "farms", sourceId: "nope", description: "xx" }, expect: 404 });
  // Valid evidence then reject → no reward.
  await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/evidence`, { method: "POST", cookie: member, body: { evidenceType: "note", description: "done" }, expect: 201 });
  const rej = await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", cookie: owner, body: { decision: "reject" } });
  assert.equal(rej.json.participation.status, "rejected");
  assert.equal(rej.json.reward, null);
  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json;
  assert.equal(ledger.items.filter((e) => e.source === "challenge_reward").length, 0);
});
test("concurrent approval issues at most one reward; conflicting decision is a safe no-op", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "admin-conc@wf.local", "WF Conc");
  const { org, challengeId } = await publishChallenge(base, owner, "wfc");
  const member = await inviteMember(base, owner, org, "member-conc@wf.local");
  const p = (await call(base, `/v1/challenges/${challengeId}/participate`, { method: "POST", cookie: member, expect: 201 })).json;
  await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/evidence`, { method: "POST", cookie: member, body: { evidenceType: "note", description: "done" }, expect: 201 });

  const results = await Promise.all(Array.from({ length: 10 }, () => fetch(`${base}/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", headers: { "content-type": "application/json", cookie: owner }, body: JSON.stringify({ decision: "approve" }) })));
  assert.ok(results.every((r) => r.status === 200));
  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json;
  assert.equal(ledger.items.filter((e) => e.source === "challenge_reward").length, 1, "one credit under concurrency");

  // Conflicting later decision cannot overwrite an approved participation.
  const conflict = await call(base, `/v1/challenges/${challengeId}/participations/${p.id}/review`, { method: "POST", cookie: owner, body: { decision: "reject" } });
  assert.ok(conflict.json.participation, "conflict returns current participation");
  assert.equal(conflict.json.participation.status, "approved");
});

test("per-user issuance limit is enforced across challenges sharing a rule", async (t) => {
  const base = await mk(t);
  const owner = await bootstrap(base, "admin-lim@wf.local", "WF Lim");
  const org = (await call(base, "/v1/organizations", { cookie: owner })).json.items[0].id;
  const rule = (await call(base, "/v1/rewards/rules", { method: "POST", cookie: owner, body: { code: "lim", title: "Lim", ecoCoinAmount: 5, issuanceLimit: 5 }, expect: 201 })).json;
  const mkCh = async (code) => {
    const ch = (await call(base, "/v1/challenges", { method: "POST", cookie: owner, body: { code, title: "CL", rewardRuleId: rule.id }, expect: 201 })).json;
    await call(base, `/v1/challenges/${ch.id}/transition`, { method: "POST", cookie: owner, body: { to: "published" } });
    return ch;
  };
  const ch1 = await mkCh("clim1");
  const ch2 = await mkCh("clim2");
  const member = await inviteMember(base, owner, org, "m1@lim.local");
  const p1 = (await call(base, `/v1/challenges/${ch1.id}/participate`, { method: "POST", cookie: member, expect: 201 })).json;
  await call(base, `/v1/challenges/${ch1.id}/participations/${p1.id}/evidence`, { method: "POST", cookie: member, body: { evidenceType: "note", description: "d1" }, expect: 201 });
  const a1 = await call(base, `/v1/challenges/${ch1.id}/participations/${p1.id}/review`, { method: "POST", cookie: owner, body: { decision: "approve" } });
  assert.equal(a1.json.reward.entry.amount, 5);
  const p2 = (await call(base, `/v1/challenges/${ch2.id}/participate`, { method: "POST", cookie: member, expect: 201 })).json;
  await call(base, `/v1/challenges/${ch2.id}/participations/${p2.id}/evidence`, { method: "POST", cookie: member, body: { evidenceType: "note", description: "d2" }, expect: 201 });
  await call(base, `/v1/challenges/${ch2.id}/participations/${p2.id}/review`, { method: "POST", cookie: owner, body: { decision: "approve" } });
  const ledger = (await call(base, "/v1/ecocoin/ledger", { cookie: owner })).json;
  assert.equal(ledger.items.filter((e) => e.source === "challenge_reward").length, 1, "per-user limit prevents a second credit");
});

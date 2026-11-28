/**
 * Phase 3.93 — soil profiles + agricultural context integrity.
 * Run: node --test services/api/tests/soil-context.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const layers = [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }];

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

async function seedContext(base, cookie) {
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie, body: { name: "Context Farm" }, expect: 201 })).json;
  const project = (await call(base, "/v1/resources/projects", { method: "POST", cookie, body: { name: "Context Project", farmId: farm.id }, expect: 201 })).json;
  return { farmId: farm.id, projectId: project.id };
}

test("soil profile CRUD and run snapshot with validated context", async (t) => {
  const base = await makeApp(t);
  const cookie = await bootstrap(base, "soil@eco.local", "Soil Org");
  const { farmId, projectId } = await seedContext(base, cookie);

  const profile = (await call(base, "/v1/soil/profiles", { method: "POST", cookie, body: { name: "Loam A", layers, source: "measured", farmId, projectId }, expect: 201 })).json.profile;
  assert.equal(profile.source, "measured");
  assert.deepEqual(profile.layers, layers);

  const listed = (await call(base, `/v1/soil/profiles?farmId=${farmId}`, { cookie })).json;
  assert.equal(listed.total, 1);

  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "soil-run", modelId: "m", modelVersion: "1.0.0", input: { layers, p: 0.5, depletion_mm: 40 }, farmId, projectId, soilProfileId: profile.id }, expect: 201 })).json.run;
  assert.equal(run.soilProfileId, profile.id);
  assert.equal(run.farmId, farmId);
  assert.equal(run.projectId, projectId);
});

test("context integrity: project/farm mismatch and cross-org ids are rejected", async (t) => {
  const base = await makeApp(t);
  const a = await bootstrap(base, "ctxA@eco.local", "Ctx A");
  const b = await bootstrap(base, "ctxB@eco.local", "Ctx B");
  const { farmId, projectId } = await seedContext(base, a);
  const otherFarm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: a, body: { name: "Other Farm" }, expect: 201 })).json;

  await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "bad", modelId: "m", modelVersion: "1.0.0", input: {}, farmId, projectId: otherFarm.id }, expect: 422 });
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie: b, body: { runKey: "cross", modelId: "m", modelVersion: "1.0.0", input: {}, farmId, projectId }, expect: 422 });
});
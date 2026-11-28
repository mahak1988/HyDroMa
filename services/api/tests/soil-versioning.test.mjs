/**
 * Phase 3.94 — soil profile versioning + observations.
 * Run: node --test services/api/tests/soil-versioning.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const PASS = "correct-horse-battery";
const layers = [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }];
const layers2 = [{ thickness_mm: 200, theta_fc: 0.35, theta_wp: 0.18 }];

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

test("profile versioning preserves history and run snapshots pin the version", async (t) => {
  const base = await makeApp(t);
  const cookie = await bootstrap(base, "ver@eco.local", "Ver Org");
  const profile = (await call(base, "/v1/soil/profiles", { method: "POST", cookie, body: { name: "V1", layers, source: "measured" }, expect: 201 })).json.profile;
  assert.equal(profile.version, 1);

  const updated = (await call(base, `/v1/soil/profiles/${profile.id}`, { method: "PATCH", cookie, body: { layers: layers2, source: "estimated" }, expect: 200 })).json.profile;
  assert.equal(updated.version, 2);

  const versions = (await call(base, `/v1/soil/profiles/${profile.id}/versions`, { cookie })).json;
  assert.equal(versions.total, 2);
  const v1 = (await call(base, `/v1/soil/profiles/${profile.id}/versions/1`, { cookie })).json.version;
  assert.deepEqual(v1.layers, layers, "historical version preserved");

  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "vr", modelId: "m", modelVersion: "1.0.0", input: { layers, p: 0.5, depletion_mm: 40 }, soilProfileId: profile.id, soilProfileVersion: 1 }, expect: 201 })).json.run;
  assert.equal(run.soilProfileVersion, 1);
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "bad", modelId: "m", modelVersion: "1.0.0", input: {}, soilProfileId: profile.id, soilProfileVersion: 99 }, expect: 422 });
});

test("observations persist with provenance and validate source/context", async (t) => {
  const base = await makeApp(t);
  const cookie = await bootstrap(base, "obs@eco.local", "Obs Org");
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie, body: { name: "Obs Farm" }, expect: 201 })).json;
  const obs = (await call(base, "/v1/soil/observations", { method: "POST", cookie, body: { farmId: farm.id, parameter: "theta_fc", value: 0.31, unit: "m3_per_m3", source: "lab_measurement", depthMm: 200, observedAt: "2026-11-27T00:00:00Z" }, expect: 201 })).json.observation;
  assert.equal(obs.source, "lab_measurement");
  assert.equal(obs.depthMm, 200);
  const list = (await call(base, `/v1/soil/observations?farmId=${farm.id}`, { cookie })).json;
  assert.equal(list.total, 1);
  await call(base, "/v1/soil/observations", { method: "POST", cookie, body: { farmId: farm.id, parameter: "theta_fc", value: 0.3, unit: "m3_per_m3", source: "made_up" }, expect: 422 });
});
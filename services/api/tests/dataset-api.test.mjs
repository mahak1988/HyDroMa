/**
 * Phase 3.97 — dataset assembly API.
 * Run: node --test services/api/tests/dataset-api.test.mjs
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
  return { base: `http://127.0.0.1:${server.address().port}`, db };
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

const csv = ["parameter,unit,value,observed_at", "air_temperature,degC,20,2026-11-01T00:00:00Z", "relative_humidity,percent,50,2026-11-01T00:00:00Z", "wind_speed,m_per_s,2,2026-11-01T00:00:00Z", "solar_radiation,MJ_per_m2_day,20,2026-11-01T00:00:00Z"].join("\n");

test("assemble dataset, persist, retrieve and map model input", async (t) => {
  const { base } = await makeApp(t);
  const cookie = await bootstrap(base, "ds@eco.local", "DS Org");
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie, body: { name: "DS Farm" }, expect: 201 })).json;
  await call(base, "/v1/env/imports", { method: "POST", cookie, body: { csv, farmId: farm.id, source: "imported" }, expect: 201 });

  const dataset = (await call(base, "/v1/datasets/assemble", { method: "POST", cookie, body: { farmId: farm.id, startDate: "2026-11-01", endDate: "2026-11-01", parameters: ["air_temperature", "relative_humidity", "wind_speed", "solar_radiation"] }, expect: 201 })).json.dataset;
  assert.equal(dataset.readiness, "READY_FOR_MAPPING");
  assert.equal(dataset.coverage, 1);

  const list = (await call(base, "/v1/datasets", { cookie })).json;
  assert.equal(list.total, 1);
  const fetched = (await call(base, `/v1/datasets/${dataset.id}`, { cookie })).json.dataset;
  assert.equal(fetched.datasetId, dataset.id);

  const mapped = (await call(base, `/v1/datasets/${dataset.id}/model-input`, { method: "POST", cookie, body: { modelId: "fao56_et0", modelVersion: "1.0.0" }, expect: 200 })).json.modelInput;
  assert.ok(mapped.inputs.temperature);
  assert.equal(mapped.provenance.scientificStatus, "NOT_VALIDATED");
});
test("dataset-backed run persists an immutable snapshot and is tenant-isolated", async (t) => {
  const { base, db } = await makeApp(t);
  const a = await bootstrap(base, "dsA@eco.local", "DS A");
  const b = await bootstrap(base, "dsB@eco.local", "DS B");
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: a, body: { name: "Bind Farm" }, expect: 201 })).json;
  await call(base, "/v1/env/imports", { method: "POST", cookie: a, body: { csv, farmId: farm.id, source: "imported" }, expect: 201 });
  const dataset = (await call(base, "/v1/datasets/assemble", { method: "POST", cookie: a, body: { farmId: farm.id, startDate: "2026-11-01", endDate: "2026-11-01", parameters: ["air_temperature", "relative_humidity", "wind_speed", "solar_radiation"] }, expect: 201 })).json.dataset;

  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "bind1", modelId: "fao56_et0", modelVersion: "1.0.0", input: {}, datasetId: dataset.id, farmId: farm.id }, expect: 201 })).json.run;
  assert.equal(run.datasetId, dataset.id);
  assert.match(run.snapshotFingerprint, /^[0-9a-f]{64}$/);
  assert.ok(run.snapshot.inputs.temperature, "snapshot persisted");

  await call(base, `/v1/hydroma/runs/${run.id}`, { cookie: b, expect: 404 });
  await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "bad", modelId: "unknown_model", modelVersion: "1.0.0", input: {}, datasetId: dataset.id }, expect: 422 });

  // Mutating the dataset afterwards must not change the run snapshot.
  const changed = JSON.stringify({ readiness: "BLOCKED" });
  db.prepare("UPDATE scientific_datasets SET payload_json = ? WHERE id = ?").run(changed, dataset.id);
  const fetched = (await call(base, `/v1/hydroma/runs/${run.id}`, { cookie: a })).json.run;
  assert.equal(fetched.snapshotFingerprint, run.snapshotFingerprint, "snapshot is independent of later dataset edits");
  assert.ok(fetched.snapshot.inputs.temperature);
});

test("dataset revisions are append-only, immutable and bound to runs", async (t) => {
  const { base, db } = await makeApp(t);
  const a = await bootstrap(base, "revA@eco.local", "Rev A");
  const b = await bootstrap(base, "revB@eco.local", "Rev B");
  const farm = (await call(base, "/v1/resources/farms", { method: "POST", cookie: a, body: { name: "Rev Farm" }, expect: 201 })).json;
  await call(base, "/v1/env/imports", { method: "POST", cookie: a, body: { csv, farmId: farm.id, source: "imported" }, expect: 201 });
  const dataset = (await call(base, "/v1/datasets/assemble", { method: "POST", cookie: a, body: { farmId: farm.id, startDate: "2026-11-01", endDate: "2026-11-01", parameters: ["air_temperature", "relative_humidity", "wind_speed", "solar_radiation"] }, expect: 201 })).json.dataset;

  let revs = (await call(base, `/v1/datasets/${dataset.id}/revisions`, { cookie: a })).json;
  assert.equal(revs.total, 1);
  assert.equal(revs.items[0].revision, 1);

  const rev2 = (await call(base, `/v1/datasets/${dataset.id}/revisions`, { method: "POST", cookie: a, body: { payload: { ...dataset, readiness: "READY_WITH_WARNINGS" } }, expect: 201 })).json.revision;
  assert.equal(rev2.revision, 2);
  revs = (await call(base, `/v1/datasets/${dataset.id}/revisions`, { cookie: a })).json;
  assert.equal(revs.total, 2, "history preserved");

  // Database-level immutability.
  assert.throws(() => db.prepare("UPDATE dataset_revisions SET readiness = 'X' WHERE revision = 1").run(), /immutable/);
  assert.throws(() => db.prepare("DELETE FROM dataset_revisions WHERE revision = 1").run(), /cannot be deleted/);

  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie: a, body: { runKey: "rev-run", modelId: "fao56_et0", modelVersion: "1.0.0", input: {}, datasetId: dataset.id, datasetRevision: 2, farmId: farm.id }, expect: 201 })).json.run;
  assert.equal(run.datasetRevision, 2);
  assert.match(run.snapshotFingerprint, /^[0-9a-f]{64}$/);

  await call(base, `/v1/datasets/${dataset.id}/revisions`, { method: "POST", cookie: a, body: { payload: { ...dataset, readiness: "BLOCKED" } }, expect: 201 });
  const fetched = (await call(base, `/v1/hydroma/runs/${run.id}`, { cookie: a })).json.run;
  assert.equal(fetched.datasetRevision, 2, "run pinned to original revision");
  assert.equal(fetched.snapshotFingerprint, run.snapshotFingerprint, "snapshot unchanged by later revisions");
  assert.equal((await call(base, `/v1/datasets/${dataset.id}/revisions`, { cookie: b })).json.total, 0, "tenant isolation");
});

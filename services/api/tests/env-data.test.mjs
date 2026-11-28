/**
 * Phase 3.95 — environmental data contracts, units, quality, import.
 * Run: node --test services/api/tests/env-data.test.mjs
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

test("parameter catalogue, unit conversion and quality flags", async (t) => {
  const base = await makeApp(t);
  const cookie = await bootstrap(base, "env@eco.local", "Env Org");
  const params = (await call(base, "/v1/env/parameters", { cookie })).json;
  assert.ok(params.items.some((p) => p.code === "soil_moisture"));

  const converted = (await call(base, "/v1/env/observations", { method: "POST", cookie, body: { parameter: "air_temperature", unit: "degF", value: 68, observedAt: "2026-11-27T00:00:00Z", source: "field_measurement" }, expect: 201 })).json.observation;
  assert.equal(converted.canonicalUnit, "degC");
  assert.ok(Math.abs(converted.canonicalValue - 20) < 1e-9, "68F -> 20C");
  assert.equal(converted.value, 68, "original preserved");
  assert.equal(converted.quality, "VALID");

  const warning = (await call(base, "/v1/env/observations", { method: "POST", cookie, body: { parameter: "soil_moisture", unit: "percent", value: 150, observedAt: "2026-11-27T01:00:00Z" }, expect: 201 })).json.observation;
  assert.equal(warning.quality, "WARNING", "out-of-range is a warning, not a hard reject");

  await call(base, "/v1/env/observations", { method: "POST", cookie, body: { parameter: "soil_moisture", unit: "kg", value: 1, observedAt: "2026-11-27T00:00:00Z" }, expect: 422 });
});

test("CSV import is atomic, validated and duplicate-safe", async (t) => {
  const base = await makeApp(t);
  const cookie = await bootstrap(base, "imp@eco.local", "Imp Org");
  const csv = ["parameter,unit,value,observed_at", "soil_moisture,m3_per_m3,0.24,2026-11-27T00:00:00Z", "air_temperature,degC,20,2026-11-27T00:00:00Z", "soil_moisture,kg,1,2026-11-27T00:00:00Z"].join("\n");
  const first = (await call(base, "/v1/env/imports", { method: "POST", cookie, body: { csv, filename: "a.csv", source: "imported" }, expect: 201 })).json.import;
  assert.equal(first.imported, 2);
  assert.equal(first.rejected, 1);

  const second = (await call(base, "/v1/env/imports", { method: "POST", cookie, body: { csv, filename: "a.csv", source: "imported" }, expect: 201 })).json.import;
  assert.equal(second.imported, 0, "duplicates are not re-imported");
  assert.equal(second.duplicates, 2);

  const list = (await call(base, "/v1/env/observations", { cookie })).json;
  assert.equal(list.total, 2);
  const imports = (await call(base, "/v1/env/imports", { cookie })).json;
  assert.equal(imports.total, 2);
});
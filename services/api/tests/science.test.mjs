/**
 * Custom science engine endpoint tests. Run: node --test services/api/tests/science.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";

const mk = async (t) => {
  const db = openDatabase(":memory:");
  const s = createServer(createApp({ db }));
  t.after(() => { s.closeAllConnections(); s.close(); });
  s.unref();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${s.address().port}`;
};

const post = (base, path, body) => fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("POST /v1/science/gdd computes GDD", async (t) => {
  const base = await mk(t);
  const r = await post(base, "/v1/science/gdd", { tMax: 30, tMin: 10, tBase: 10 });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.outputs.gdd, 10);
  assert.equal(body.scientificStatus, "NOT_VALIDATED");
});

test("POST /v1/science/gdd rejects invalid input", async (t) => {
  const base = await mk(t);
  const r = await post(base, "/v1/science/gdd", { tMax: 5, tMin: 10, tBase: 0 });
  assert.equal(r.status, 422);
});

test("POST /v1/science/et0 computes ET0", async (t) => {
  const base = await mk(t);
  const r = await post(base, "/v1/science/et0", { tMax: 30, tMin: 15, ra: 40 });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.ok(body.outputs.et0 > 0);
});
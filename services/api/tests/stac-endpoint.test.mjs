/**
 * STAC endpoint test. Run: node --test services/api/tests/stac-endpoint.test.mjs
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

test("GET /v1/stac/search returns fixture items", async (t) => {
  const base = await mk(t);
  const r = await fetch(base + "/v1/stac/search?limit=5");
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.total, 1);
  assert.equal(body.items[0].properties.source, "fixture");
});

test("GET /v1/stac/collections/:id returns fixture collection or 404", async (t) => {
  const base = await mk(t);
  const ok = await fetch(base + "/v1/stac/collections/eco-nojin-fixture");
  assert.equal(ok.status, 200);
  const missing = await fetch(base + "/v1/stac/collections/missing");
  assert.equal(missing.status, 404);
});
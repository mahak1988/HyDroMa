/**
 * STAC adapter fixture tests. Run: node --test services/api/tests/stac.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { searchStac, getStacCollection } from "../src/stac.mjs";

test("stac search returns deterministic fixture items", () => {
  const r = searchStac({ limit: 10 });
  assert.equal(r.total, 1);
  assert.equal(r.items[0].source, undefined);
  assert.equal(r.items[0].properties.source, "fixture");
});

test("stac collection lookup is fixture-scoped", () => {
  assert.equal(getStacCollection("eco-nojin-fixture").id, "eco-nojin-fixture");
  assert.equal(getStacCollection("missing"), null);
});
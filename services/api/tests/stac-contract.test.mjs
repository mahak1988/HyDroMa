/**
 * STAC contract wiring test. Run: node --test services/api/tests/stac-contract.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { stacContract } from "../src/stac-contract.mjs";

test("stac contract exposes search and getCollection", async () => {
  assert.equal(stacContract.version, "0.1.0");
  const r = await stacContract.search({});
  assert.equal(r.total, 1);
  const c = await stacContract.getCollection("eco-nojin-fixture");
  assert.equal(c.id, "eco-nojin-fixture");
});
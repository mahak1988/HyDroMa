import test from "node:test";
import assert from "node:assert/strict";
import {
  CANONICALIZATION_VERSION,
  HASH_ALGORITHM,
  GENESIS_HASH,
  canonicalize,
  sha256Hex,
  hashWithDomain,
  hashRecord,
  verifyRecord,
  buildManifest,
  manifestHash,
  createChain,
  appendEntry,
  verifyChain,
} from "../src/transparency.mjs";

test("canonicalize is key-order independent and compact", () => {
  assert.equal(canonicalize({ b: 1, a: 2 }), '{"a":2,"b":1}');
  assert.equal(canonicalize({ z: 1, a: "x", n: null }), '{"a":"x","n":null,"z":1}');
});

test("canonicalize preserves array order and unicode (no ascii escaping)", () => {
  assert.equal(canonicalize([3, 1, 2]), "[3,1,2]");
  assert.equal(canonicalize({ name: "کشت" }), '{"name":"کشت"}');
});

test("canonicalize normalizes negative zero and rejects non-finite/undefined/bigint", () => {
  assert.equal(canonicalize(-0), "0");
  assert.throws(() => canonicalize(NaN), TypeError);
  assert.throws(() => canonicalize(Infinity), TypeError);
  assert.throws(() => canonicalize(undefined), TypeError);
  assert.throws(() => canonicalize(1n), TypeError);
});

test("sha256 matches the known vector for 'abc'", () => {
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("hashRecord is reproducible and detects modification", () => {
  const record = { id: "r1", org: "o1", amount: 5, note: "ok" };
  const h = hashRecord(record);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(verifyRecord(record, h), true);
  assert.equal(verifyRecord({ ...record, amount: 6 }, h), false);
});

test("domain separation changes the digest", () => {
  const a = hashWithDomain("eco-nojin.record.v1", { x: 1 });
  const b = hashWithDomain("eco-nojin.other.v1", { x: 1 });
  assert.notEqual(a, b);
});

test("manifest is reproducible and sensitive to content hash", () => {
  const base = {
    recordId: "r1",
    recordType: "eco_coin_ledger",
    orgId: "o1",
    eventId: "e1",
    revision: 1,
    contentHash: "a".repeat(64),
    eventTimestamp: "2026-11-27T00:00:00Z",
  };
  const m1 = buildManifest(base);
  const m2 = buildManifest(base);
  assert.deepEqual(m1, m2);
  assert.equal(m1.canonicalizationVersion, CANONICALIZATION_VERSION);
  assert.equal(m1.hashAlgorithm, HASH_ALGORITHM);
  assert.equal(m1.verificationStatus, "UNVERIFIED");
  const changed = buildManifest({ ...base, contentHash: "b".repeat(64) });
  assert.notEqual(manifestHash(m1), manifestHash(changed));
});

test("chain verifies when intact and is deterministic", () => {
  const build = () => {
    const c = createChain("o1");
    appendEntry(c, { recordId: "r1", recordType: "t", revision: 1, contentHash: "1".repeat(64), eventTimestamp: "t1" });
    appendEntry(c, { recordId: "r2", recordType: "t", revision: 1, contentHash: "2".repeat(64), eventTimestamp: "t2" });
    appendEntry(c, { recordId: "r3", recordType: "t", revision: 1, contentHash: "3".repeat(64), eventTimestamp: "t3" });
    return c;
  };
  const c1 = build();
  const c2 = build();
  assert.deepEqual(c1, c2);
  const result = verifyChain(c1);
  assert.equal(result.ok, true);
  assert.equal(result.length, 3);
  assert.equal(c1.entries[0].previousHash, GENESIS_HASH);
});

test("chain detects content tampering at the right index", () => {
  const c = createChain("o1");
  appendEntry(c, { recordId: "r1", recordType: "t", revision: 1, contentHash: "1".repeat(64), eventTimestamp: "t1" });
  appendEntry(c, { recordId: "r2", recordType: "t", revision: 1, contentHash: "2".repeat(64), eventTimestamp: "t2" });
  c.entries[1].contentHash = "f".repeat(64);
  const result = verifyChain(c);
  assert.equal(result.ok, false);
  assert.equal(result.brokenAt, 1);
  assert.equal(result.reason, "entryHash mismatch");
});

test("chain detects a broken previousHash link", () => {
  const c = createChain("o1");
  appendEntry(c, { recordId: "r1", recordType: "t", revision: 1, contentHash: "1".repeat(64), eventTimestamp: "t1" });
  appendEntry(c, { recordId: "r2", recordType: "t", revision: 1, contentHash: "2".repeat(64), eventTimestamp: "t2" });
  c.entries[1].previousHash = "0".repeat(64);
  const result = verifyChain(c);
  assert.equal(result.ok, false);
  assert.equal(result.brokenAt, 1);
  assert.equal(result.reason, "previousHash mismatch");
});

test("chain detects index reordering", () => {
  const c = createChain("o1");
  appendEntry(c, { recordId: "r1", recordType: "t", revision: 1, contentHash: "1".repeat(64), eventTimestamp: "t1" });
  appendEntry(c, { recordId: "r2", recordType: "t", revision: 1, contentHash: "2".repeat(64), eventTimestamp: "t2" });
  c.entries.reverse();
  const result = verifyChain(c);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "index mismatch");
});

test("tenant isolation: same content in different orgs yields different entry hashes", () => {
  const entry = { recordId: "r1", recordType: "t", revision: 1, contentHash: "1".repeat(64), eventTimestamp: "t1" };
  const a = createChain("org-a");
  const b = createChain("org-b");
  appendEntry(a, entry);
  appendEntry(b, entry);
  assert.notEqual(a.entries[0].entryHash, b.entries[0].entryHash);
  assert.equal(verifyChain(a).ok, true);
  assert.equal(verifyChain(b).ok, true);
});

test("empty chain verifies with genesis head", () => {
  const c = createChain("o1");
  const result = verifyChain(c);
  assert.equal(result.ok, true);
  assert.equal(result.length, 0);
  assert.equal(result.head, GENESIS_HASH);
});

test("canonicalize rejects an own __proto__ key", () => {
  const obj = JSON.parse('{"__proto__": 1, "a": 2}');
  assert.throws(() => canonicalize(obj), TypeError);
});

test("canonicalize rejects function values (incl. toJSON overrides)", () => {
  assert.throws(() => canonicalize({ a: 1, toJSON: () => ({ a: 2 }) }), TypeError);
});

test("canonicalize handles large finite numbers deterministically", () => {
  assert.equal(canonicalize(1e300), "1e+300");
  assert.equal(canonicalize({ n: 1e300 }), '{"n":1e+300}');
});

test("canonicalize does NOT unicode-normalize (NFC vs NFD differ) to match provenance.py", () => {
  const nfc = "\u00E9";
  const nfd = "e\u0301";
  assert.notEqual(canonicalize(nfc), canonicalize(nfd));
});

test("canonicalize normalizes nested negative zero", () => {
  assert.equal(canonicalize({ a: [-0, 1] }), '{"a":[0,1]}');
});

test("verifyChain cannot detect tail truncation without an external head", () => {
  const c = createChain("o1");
  appendEntry(c, { recordId: "r1", recordType: "t", revision: 1, contentHash: "1".repeat(64), eventTimestamp: "t1" });
  appendEntry(c, { recordId: "r2", recordType: "t", revision: 1, contentHash: "2".repeat(64), eventTimestamp: "t2" });
  const fullHead = verifyChain(c).head;
  c.entries.pop();
  const truncated = verifyChain(c);
  assert.equal(truncated.ok, true);
  assert.notEqual(truncated.head, fullHead);
});
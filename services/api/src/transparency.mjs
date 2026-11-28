import { createHash } from "node:crypto";

export const CANONICALIZATION_VERSION = "eco-nojin.canonical.v1";
export const HASH_ALGORITHM = "sha-256";
export const RECORD_HASH_DOMAIN = "eco-nojin.record.v1";
export const MANIFEST_SCHEMA_VERSION = "eco-nojin.manifest.v1";
export const CHAIN_SCHEMA_VERSION = "eco-nojin.chain.v1";
export const GENESIS_HASH = "0".repeat(64);

function encode(value) {
  if (value === null) return "null";
  const type = typeof value;
  if (type === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non-finite number is not canonicalizable");
    if (Object.is(value, -0)) return "0";
    return JSON.stringify(value);
  }
  if (type === "string") return JSON.stringify(value);
  if (type === "boolean") return value ? "true" : "false";
  if (type === "undefined") throw new TypeError("undefined is not canonicalizable");
  if (type === "bigint") throw new TypeError("bigint is not canonicalizable");
  if (type === "object") {
    if (Array.isArray(value)) return "[" + value.map(encode).join(",") + "]";
    const keys = Object.keys(value).sort();
    for (const k of keys) {
      if (k === "__proto__") throw new TypeError("__proto__ key is not canonicalizable");
    }
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + encode(value[k])).join(",") + "}";
  }
  throw new TypeError("unsupported type: " + type);
}

export function canonicalize(value) {
  return encode(value);
}

export function sha256Hex(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hashWithDomain(domain, value) {
  return sha256Hex(domain + "\u0000" + canonicalize(value));
}

export function hashRecord(record, domain = RECORD_HASH_DOMAIN) {
  return hashWithDomain(domain, record);
}

export function verifyRecord(record, expectedHash, domain = RECORD_HASH_DOMAIN) {
  return hashRecord(record, domain) === expectedHash;
}

export function buildManifest(input) {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    recordId: input.recordId,
    recordType: input.recordType,
    orgId: input.orgId,
    eventId: input.eventId,
    revision: input.revision,
    contentHash: input.contentHash,
    canonicalizationVersion: input.canonicalizationVersion ?? CANONICALIZATION_VERSION,
    hashAlgorithm: input.hashAlgorithm ?? HASH_ALGORITHM,
    eventTimestamp: input.eventTimestamp,
    provenanceRef: input.provenanceRef ?? null,
    actorRef: input.actorRef ?? null,
    previousEventHash: input.previousEventHash ?? null,
    verificationStatus: input.verificationStatus ?? "UNVERIFIED",
  };
}

export function manifestHash(manifest) {
  return hashWithDomain(MANIFEST_SCHEMA_VERSION, manifest);
}

export function createChain(orgId) {
  if (typeof orgId !== "string" || orgId.length === 0) throw new TypeError("orgId is required");
  return { schemaVersion: CHAIN_SCHEMA_VERSION, orgId, entries: [] };
}

function chainEntryHash(orgId, entry) {
  return hashWithDomain(CHAIN_SCHEMA_VERSION, {
    orgId,
    index: entry.index,
    recordId: entry.recordId,
    recordType: entry.recordType,
    revision: entry.revision,
    contentHash: entry.contentHash,
    eventTimestamp: entry.eventTimestamp,
    previousHash: entry.previousHash,
    canonicalizationVersion: entry.canonicalizationVersion,
    hashAlgorithm: entry.hashAlgorithm,
  });
}

export function appendEntry(chain, entry) {
  const index = chain.entries.length;
  const previousHash = index === 0 ? GENESIS_HASH : chain.entries[index - 1].entryHash;
  const record = {
    index,
    recordId: entry.recordId,
    recordType: entry.recordType,
    revision: entry.revision,
    contentHash: entry.contentHash,
    eventTimestamp: entry.eventTimestamp,
    previousHash,
    canonicalizationVersion: entry.canonicalizationVersion ?? CANONICALIZATION_VERSION,
    hashAlgorithm: entry.hashAlgorithm ?? HASH_ALGORITHM,
  };
  record.entryHash = chainEntryHash(chain.orgId, record);
  chain.entries.push(record);
  return record;
}

export function verifyChain(chain) {
  if (!chain || typeof chain.orgId !== "string" || !Array.isArray(chain.entries)) {
    return { ok: false, reason: "invalid chain" };
  }
  let previous = GENESIS_HASH;
  for (let i = 0; i < chain.entries.length; i += 1) {
    const entry = chain.entries[i];
    if (entry.index !== i) return { ok: false, brokenAt: i, reason: "index mismatch" };
    if (entry.previousHash !== previous) return { ok: false, brokenAt: i, reason: "previousHash mismatch" };
    if (chainEntryHash(chain.orgId, entry) !== entry.entryHash) {
      return { ok: false, brokenAt: i, reason: "entryHash mismatch" };
    }
    previous = entry.entryHash;
  }
  return { ok: true, length: chain.entries.length, head: previous };
}
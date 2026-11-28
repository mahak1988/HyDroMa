# Stage 3 — Cryptographic Transparency Architecture & Implementation Readiness

**Project:** Eco Nojin · **Executor:** ERNIE 5.5 Flash Preview · **Reviewer:** Nemotron 3 Ultra
**Classification:** `CONVENTIONAL_CRYPTOGRAPHIC_TRANSPARENCY_FOUNDATION`
**Blockchain / Smart contracts / Deployment:** NOT AUTHORIZED · **HIC:** INACTIVE · **EcoCoin:** NON-MONETARY
**Date:** 2026-11-27 (message time 22:29 UTC)
**Final classification:** `CRYPTOGRAPHIC_TRANSPARENCY_PARTIALLY_IMPLEMENTED`

> Scope: a minimal, conventional, **cryptographically verifiable** transparency foundation. No
> blockchain, token, wallet, key-management service, external anchoring, or monetary function was
> introduced. No existing source file was modified. See §2 and §13.

---

## 1. Baseline

| Item | Value |
|---|---|
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` (unchanged) |
| Branch | `main` |
| Last commit | `a310306` 2026-11-26 05:57:45 +0330 (merge) |
| Working tree | 331 porcelain entries (pre-existing + concurrent, not this agent's) |
| Concurrent tracked work | `services/api/src/db.mjs` **+820**, `services/api/src/server.mjs` **+1122** (uncommitted) |
| Concurrent mtimes | `db.mjs` 20:26:33, `server.mjs` 20:27:23 local (~16:56 UTC), i.e. ~5.5 h before this 22:29 UTC message — stable but uncommitted |
| This agent's writes | 2 new files + this report (no edits to any existing file) |

## 2. Worktree protection

- **No** `reset`/`clean`/`stash`/`checkout`/`revert`/delete of any concurrent work.
- **No** edit to `db.mjs`, `server.mjs`, `dist/`, or any tracked file.
- Implementation was **isolated** to two new files:
  - `services/api/src/transparency.mjs` (pure, zero-dependency, no DB, no I/O).
  - `services/api/tests/transparency.test.mjs` (pure, no shared DB).
- **Ownership/change boundary:** the +820/+1122 uncommitted changes have **no commit boundary** and
  cannot be attributed; editing those files would entangle this work with unknown concurrent work.
  Per mission §2/§14, DB/API wiring is therefore **not** performed — it is specified as a gated step.
- HEAD unchanged before/after (verified).

## 3. Architecture

Adopted direction: **Alternative 1+ — Conventional + Cryptographic Transparency** (Stage 2). This stage
delivers the **pure cryptographic core** as a library module, deliberately decoupled from persistence
and transport so it can be wired later without touching concurrent files:

```
record (canonical) ──canonicalize()──▶ string ──sha256(domain‖string)──▶ contentHash
contentHash ──buildManifest()──▶ manifest ──manifestHash()──▶ manifestHash
entries ──appendEntry()──▶ hash-chained chain ──verifyChain()──▶ {ok, brokenAt?, head}
```

**Properties provided:** deterministic canonicalization; content-addressable integrity; tamper-evident
per-tenant hash chains; verification of a record, a manifest, or a chain.
**Properties NOT provided:** confidentiality (hashing ≠ encryption); scientific validity; protection
against an admin who rewrites *both* operational records and the integrity metadata; external
timestamping/anchoring; key management; multi-writer concurrency safety at the storage layer.

## 4. Threat model (preliminary)

| Threat | In scope? | Handling |
|---|---|---|
| Accidental/partial record mutation | Yes | `verifyRecord` detects any content-hash change |
| Reordering / deletion of chain entries | Yes | `verifyChain` detects index/previousHash/entryHash breaks |
| Cross-tenant data mixing | Yes | chain is org-scoped; `orgId` is inside the hash domain |
| Replay of an old manifest | Partial | manifest carries `eventId`+`revision`; consumer must enforce uniqueness (future) |
| Admin rewrites records **and** recomputes the chain | **No** | explicitly out of scope; needs external anchoring + key custody (separate authorization) |
| Hash collision | No (assumed) | SHA-256 collision resistance assumed |
| Canonicalization ambiguity | Mitigated | strict versioned contract; rejects NaN/Infinity/undefined/bigint |
| Scientific misrepresentation | No | cryptographic verification never upgrades scientific status (§11) |

**Terminology:** the system is **tamper-evident** and **integrity-verifiable** *under the stated
assumptions*; it is **not** tamper-proof.

## 5. Canonicalization

Versioned contract `eco-nojin.canonical.v1` (`CANONICALIZATION_VERSION`), aligned **by construction**
with the existing engine standard `engines/hydroma/hydroma/provenance.py` (`canonical_json`):

- Object keys sorted lexicographically; array order preserved.
- Compact separators (`,`, `:`); no insignificant whitespace.
- UTF-8, `ensure_ascii=false` (unicode preserved, not `\u`-escaped).
- Numbers finite only; `-0` normalized to `0`; `NaN`/`Infinity`/`undefined`/`bigint`/functions rejected.
- `null` → `null`; booleans → `true`/`false`.

**Cross-language parity (verified, read-only, on 2 hand-picked vectors only):** Python
`json.dumps(obj, sort_keys=True, separators=(",",":"), ensure_ascii=False, allow_nan=False)` and the JS
`canonicalize()` both produce `{"a":2,"b":1}` and `{"name":"کشت"}` for the same inputs. Exhaustive
fixture parity across many types is a gated follow-up (§13). Note: neither side unicode-normalizes
(NFC/NFD differ by design, matching `provenance.py`); callers must supply NFC-normalized input.

## 6. Hash design

- **Algorithm:** SHA-256 (`HASH_ALGORITHM = "sha-256"`), lowercase hex (64 chars).
- **Domain separation:** `sha256(domain + "\u0000" + canonical(value))`; domains
  `eco-nojin.record.v1`, `eco-nojin.manifest.v1`, `eco-nojin.chain.v1` prevent cross-context reuse.
- **Versioning:** canonicalization version + hash algorithm are carried in manifests/entries.
- **No encryption** is introduced; hashing and confidentiality are separate requirements.
- **Migration:** a future algorithm/version bump is a new domain/version, never a silent re-hash.

## 7. Manifest design

`buildManifest()` emits (`eco-nojin.manifest.v1`): `recordId, recordType, orgId, eventId, revision,
contentHash, canonicalizationVersion, hashAlgorithm, eventTimestamp, provenanceRef, actorRef,
previousEventHash, verificationStatus` (default `UNVERIFIED`). No operational payload, no secrets, no
personal data beyond an actor reference. `manifestHash()` gives a stable digest.
**Provides:** a *self-contained* claim that *a specific revision of a specific record in a specific
org had a specific content hash at a specific event*, verifiable **given the manifest**. Independent
third-party verification additionally requires signatures and/or external anchoring (not implemented).
**Does not provide:** truth of the content, scientific validity, or non-repudiation by a named human.

## 8. Verification

- `verifyRecord(record, expectedHash)` → bool.
- `verifyChain(chain)` → `{ok, length, head}` or `{ok:false, brokenAt, reason}` with reasons
  `index mismatch` / `previousHash mismatch` / `entryHash mismatch`.
- **Existing `verify` endpoint is different**: `POST /v1/challenges/:id/participations/:pid/verify`
  (`server.mjs:1957`) is a *participation attestation* (owner/admin), **not** content-integrity
  verification. There is **no** existing content-hash/manifest/chain verifier, so this module does not
  duplicate or replace it. A future integrity endpoint must not be named/claimed as "global integrity".

## 9. API (design only — not wired)

Wiring is blocked (concurrent `server.mjs`/`db.mjs`). Proposed, gated design (no code now):
- `POST /v1/integrity/manifests` (write, RBAC, tenant-scoped) — build+store manifest for a record revision.
- `GET /v1/integrity/records/:id/verify` — verify one record's content hash (explicitly *single-record*).
- `GET /v1/integrity/chains/:orgId/verify` — verify a tenant chain (explicitly *chain-scoped*).
Responses must state scope (single-record vs chain) and never imply global/scientific validity.

## 10. Security

- **Tenant isolation:** chains are per-`orgId`; `orgId` is inside the hash domain, so identical content
  in two orgs yields different entry hashes (tested).
- **Authorization / actor identity:** to be enforced by the future API layer (reuse `ROLE_RANK`/`requireWrite`/`orgFrom`).
- **Idempotency/concurrency:** `appendEntry` is deterministic; persistence must serialize appends
  (single-writer SQLite today). A `UNIQUE(org_id,event_id)` constraint is **proposed only** — no
  `event_id` column exists in `db.mjs` today; the persistence schema is a gated design step (§9/§13).
- **Correction/deletion:** corrections are new entries (append-only), never mutation; deletion is out of
  scope for integrity records.
- **No secrets/keys** introduced; key management is explicitly out of scope.
- **Admin manipulation:** an admin with DB write access can alter records and recompute the chain — this
  is why the design is *tamper-evident*, not *tamper-proof*; closing it needs external anchoring + key
  custody (separate authorization).

## 11. Scientific data

Cryptographic verification proves only that a record is unchanged relative to a trusted reference. It
**cannot** prove scientific accuracy, calibration, model validity, measurement correctness, dataset
authenticity, or field-observation accuracy. Scientific maturity (`maturity.py` two-axis model) and
scientific status (`NOT_VALIDATED`) are **not** upgraded by any hash/manifest/chain. HyDroMA governance
is untouched.

## 12. Scalability (SQLite, no migration)

No benchmarks were run; no performance claims are made. Conditions that would justify revisiting the
store (owner decision, not this stage): sustained high event volume; chain-append contention under
concurrent writes; verification p99 latency target breach; storage/backup growth beyond retention
policy; multi-process writers. These are **thresholds to measure**, not asserted limits.

## 13. Implementation limitations

- **Wiring not implemented** (concurrent `db.mjs`/`server.mjs`): no persistence, no API, no migration.
- **No key management / signatures / external timestamping** (out of scope).
- **Cross-language parity** verified on 2 vectors only; broad fixture parity is a gated follow-up.
- **Number formatting** for very large/small magnitudes may differ between JS and Python (documented;
  inputs should stay within safe, canonical ranges).
- **Concurrency** at the storage layer is unproven (single-writer assumption).

## 14. Tests

`node --test services/api/tests/transparency.test.mjs` → **19/19 pass**, no shared DB touched:
canonicalization reproducibility + unicode + rejection cases (NaN/Infinity/undefined/bigint/function/
`__proto__`) + large-number + nested `-0` + NFC≠NFD; SHA-256 known vector (`abc`); record hash +
modification detection; domain separation; manifest reproducibility + sensitivity; chain
intact/deterministic; tamper (content), broken link, reorder; tenant isolation; empty chain; and an
**honest truncation test** (tail removal is *not* detectable by `verifyChain` alone). Plus a read-only
Python parity check (2 vectors) matching the JS output. **Not covered:** exhaustive cross-language
fixtures, storage-level concurrency, persistence, signatures.

## 15. Remaining risks

Admin simultaneous rewrite (out of scope); **tail truncation not detectable without an external head/
anchor**; no signatures/non-repudiation yet; no external anchoring;
storage concurrency unproven; cross-language parity not exhaustively fixture-tested; future API must not
over-claim scope.

## 16. Independent review readiness

Ready for **Nemotron 3 Ultra** to review the **actual** files
(`services/api/src/transparency.mjs`, `services/api/tests/transparency.test.mjs`) against this report:
canonicalization, hashing, manifest, chain, verification, tenant isolation, concurrency assumptions,
scientific-governance separation, SQLite scalability assumptions, test evidence, and limitations. The
reviewer's findings will be resolved via source evidence and the reproducible test run — not accepted blindly.

---

## Appendix — Independent Review (mission §16)

**Reviewer:** **Nemotron 3 Ultra** (provider `kilo`, free variant). **Mode:** adversarial (challenge, not
approve). **Date:** 2026-11-27. Reviewed the actual `transparency.mjs`, `transparency.test.mjs`, and this
report. Genuine review, not fabricated.

**Reviewer overall:** `CRYPTOGRAPHIC_TRANSPARENCY_PARTIALLY_IMPLEMENTED` is correct ("the cryptographic
core exists and is tested; the transparency *system* — persistence, API, concurrency, signatures,
anchoring — does not").

### Accepted (fixed in code/report)
- **`__proto__` key not guarded** → `encode()` now throws on an own `__proto__` key; test added (19/19).
- **`UNIQUE(org_id,event_id)` presented as design fact** → §10 corrected: `event_id` column does **not**
  exist; marked proposed-only.
- **Chain truncation not detectable** → acknowledged in §14/§15 with an explicit test; needs external
  head/anchor (future).
- **Over-claims softened** → §7 "self-contained claim … third-party needs signatures/anchoring"; §5
  parity "2 hand-picked vectors only"; §14 test-coverage gaps listed.

### Rejected with source evidence (conflict, not silently resolved)
- **"Handle `toJSON` override"** → **reviewer wrong**: `encode()` never calls `JSON.stringify` on objects
  (only on strings/numbers); a `toJSON`/function value is *rejected* (throws). Test added.
- **"Add Unicode NFC/NFD normalization"** → **rejected by design**: `provenance.py:canonical_json` does
  **not** normalize; normalizing would **break cross-language parity**. Contract is byte-exact; callers
  must supply NFC input (documented §5, test asserts NFC≠NFD).
- **"Use `hasOwnProperty` vs `Object.keys`"** → `Object.keys` already returns own-enumerable keys only;
  the explicit `__proto__` guard covers the ambiguity.

### Not implemented (gated, require separate authorization / safe worktree)
Persistence schema + migration, API endpoints, signatures, external anchoring, storage concurrency.

**Final classification:** `CRYPTOGRAPHIC_TRANSPARENCY_PARTIALLY_IMPLEMENTED`
# Phase 3.101 — HyDroMA EngineGateway & Controlled Scientific Model Execution

**Classification:** `HYDROMA_CONTROLLED_EXECUTION_IMPLEMENTED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN`

## Architecture reconnaissance
No API→engine model execution existed. Reused run/dataset/snapshot/manifest contracts. Chose a **local isolated subprocess adapter** (`engines/hydroma/.venv` + `hydroma.exec_worker`) — no new service/worker/container; engine stays independent.

## Selected mechanism & rationale
Backend spawns the engine worker with JSON stdin/stdout (timeout, max buffer). API never imports engine internals; worker never imports API. Loopback/no network.

## EngineGateway contract
Resolve run (org) → verify snapshot fingerprint → verify dataset revision → require explicit flat `modelInput` (no inferred transformations) → execute worker → validate result → capture observed manifest → persist attempt.

## Run lifecycle
Existing run status `QUEUED→RUNNING→COMPLETED|FAILED`; execution attempts append-only (`hydroma_execution_attempts`, migration 10). Duplicate SUCCEEDED attempt returns existing (no re-execute); RUNNING → 409; retries create new attempt (history preserved).

## Actual execution evidence
`fao56_et0` executed in the real engine venv: output `et0_mm_per_day > 0`, manifest captured (`observed.execution=isolated-subprocess`, Python 3.12.15, model source fingerprint), output + manifest SHA-256. Two identical runs produced **identical output fingerprints** (exact determinism).

## Actual execution manifest
Built in the worker process (not API), persisted per attempt; unavailable values explicit (`lockfile_fingerprint`, `source_revision`).

## Input/output provenance
Run → org → dataset/revision (when bound) → snapshot/fingerprint → model/version → manifest/fingerprint → attempt → output/fingerprint.

## Persistence changes
Additive migration 10 only; historical runs/snapshots untouched; legacy runs readable.

## Error/retry
Structured errors (unsupported model/version, invalid input, timeout, engine failure, snapshot mismatch, cross-org 404); no silent overwrite; retries append attempts.

## Tests (actual)
`execution-api.test.mjs`: 1 pass (real engine, determinism, duplicate, isolation, invalid input). Full API **105 pass + 1 opt-in**; Vitest **560 pass**; engine **1542 pass**; lint/boundaries/arch/typecheck/build/bundle pass.

## Determinism per model
- `fao56_et0`: exact repeat determinism **verified**.
- `water_balance`: worker supported; repeat execution **not run** (no validated sample) — pending.

## Independent review (Nemotron 3 Ultra)
API/engine separation real; manifest observed in worker; snapshot/revision checks; duplicate protection; tenant isolation; no fabricated reproducibility. Findings: water_balance determinism unverified; modelInput must be supplied (no series→flat inference); no cross-environment comparison; no scientific validation. Accepted with limitations.

## Remaining limitations
No automatic dataset-series→model-input transformation; water_balance repeat not executed; no load/cross-env; source revision/lockfile unknown; models `NOT_VALIDATED`.

## Implemented vs tested vs verified vs reproducible vs validated
Implemented: gateway/worker/persistence. Tested: real API + suites. Verified: execution/manifest/determinism(fao56). Reproducible: exact for fao56 only. Scientifically validated: **no**.

**Final:** `HYDROMA_CONTROLLED_EXECUTION_IMPLEMENTED_WITH_LIMITATIONS`.
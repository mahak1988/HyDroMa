# Phase 3.99 — Immutable Dataset Revisions & Provenance Integrity

**Classification:** `DATASET_REVISIONING_IMPLEMENTED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN`

## Baseline & final state
`main` @ `a3103061f561eb4289137b5f3362785580dfe28b` (unchanged); 0 staged/deleted; 34 modified; 260 untracked; prod DB 04:55:35. No git mutations.

## Architecture reconnaissance
Reused Phase 3.97–3.98 datasets, runs, snapshots, mapping, tenancy/RBAC/audit. No parallel architecture.

## Database/API changes
- Migration 9 (additive): `scientific_datasets.current_revision/updated_at`; `hydroma_runs.dataset_revision`; `dataset_revisions` (append-only, unique `(dataset_id,revision)`); indexes; backfill revision 1 for existing datasets.
- **DB-level immutability:** `BEFORE UPDATE/DELETE` triggers `RAISE(ABORT)` on `dataset_revisions`.
- API: `GET/POST /v1/datasets/:id/revisions`; run create accepts `datasetRevision`, validates existence, pins it; run view exposes revision.

## Revision semantics
First assembly = revision 1; explicit `POST …/revisions` creates next revision (no silent overwrite); history append-only; org-scoped.

## Immutability enforcement level
Database triggers (not app-only) block revision update/delete; `scientific_datasets` current row remains mutable but revisions preserve history. Limitation: no DB trigger preventing `scientific_datasets` payload edits (snapshot protects runs).

## Canonicalization contract (v1.0.0)
`json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=False)` → SHA-256; snapshot includes `snapshotVersion`, `hashAlgorithm`; non-finite rejected upstream; known test vector `{"a":1,"b":[2,3]}` → `efbd0040…`.

## Run-to-revision
Run persists `dataset_id` + `dataset_revision` + snapshot + fingerprint; later revisions don't alter snapshot (tested). Legacy runs without revision remain readable (`null`).

## Migration compatibility
Additive; backfill revision 1; existing runs untouched.

## Tests (actual)
- Engine dataset tests: 5 pass (incl. fingerprint vector/determinism/sensitivity).
- API dataset tests: 3 pass (assemble, binding, revisions immutability/isolation).
- Full engine **1537 pass**; API **104 pass + 1 opt-in**; Vitest **560 pass**; dataset live E2E 1 pass.
- lint/boundaries/arch/typecheck/build/bundle pass.

## Independent review (Nemotron 3 Ultra)
Confirmed DB-level revision immutability, tenant isolation, run pinning, snapshot independence, canonical determinism. Findings: `scientific_datasets` current row mutable (accepted, revisions preserve); legacy runs lack revision (accepted); no full-history/security audit. No silent historical rewrite path found.

## Remaining limitations
Execution reproducibility not established; dataset current-row mutable; legacy revision null; no scientific validation; full E2E suite not run.

## Implemented vs tested vs verified vs validated
Implemented: revisions/triggers/binding. Tested: unit/API/E2E. Verified: immutability/isolation/snapshot. Scientifically validated: **no** (`NOT_VALIDATED`).

**Final:** `DATASET_REVISIONING_IMPLEMENTED_WITH_LIMITATIONS`.
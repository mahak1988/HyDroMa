# Phase 3.98 — Scientific Dataset-to-Run Binding & Reproducible Input Provenance

**Classification:** `SCIENTIFIC_DATASET_RUN_BINDING_COMPLETED_WITH_LIMITATIONS`
**Date:** 2026-11-27
**Repository:** `D:\NOJIN` · **Engine:** `D:\NOJIN\engines\hydroma`

## 1. Classification
`SCIENTIFIC_DATASET_RUN_BINDING_COMPLETED_WITH_LIMITATIONS`

## 2. Baseline
`main` @ `a3103061f561eb4289137b5f3362785580dfe28b`; 0 staged/deleted; 34 modified; 259 untracked; prod DB 04:55:35.

## 3. Architecture reconnaissance
Reused Phase 3.97 datasets, `hydroma_runs`, mapping (`mapModelInput`), env observations, audit/RBAC/tenancy. No parallel architecture.

## 4. Files changed
`services/api/src/db.mjs`, `server.mjs`, `packages/api-client/src/client.ts`, `apps/platform/src/services/hooks.ts`, `sections/agriculture/DatasetBuilderModule.tsx`, engine `dataset_assembly.py`, tests (`dataset-api.test.mjs`, `test_dataset_assembly.py`, `runs.test.mjs`).

## 5. Database changes
Migration 8 (additive): `hydroma_runs.snapshot_json`, `snapshot_fingerprint`, index `(org_id,dataset_id)`. No destructive change.

## 6. API changes
`POST /v1/hydroma/runs` accepts `datasetId`; server resolves dataset (org-scoped), validates farm/project match, maps model input (`fao56_et0`/`water_balance`), rejects unsupported/incomplete, persists snapshot + fingerprint, audits. Existing routes unchanged.

## 7. Engine changes
`snapshot_fingerprint(snapshot)` = SHA-256 over `json.dumps(sort_keys,separators=(',',':'))`; deterministic and sensitive.

## 8. Frontend changes
Dataset Builder: “Create run from dataset” → run id + fingerprint; existing design/RTL.

## 9. Snapshot semantics
Snapshot includes dataset id/revision, assembly version, model id/version, mapping version/provenance, canonical inputs/units, scientific status; persisted at creation, independent of later dataset edits.

## 10. Canonicalization/hashing
Sorted-key compact JSON → SHA-256; tests for determinism and sensitivity.

## 11. Dataset/run relationship
`dataset_id` persisted; org/tenant enforced; dataset farm/project consistency checked.

## 12. Provenance design
Run → org → farm/project → dataset → mapping → snapshot → fingerprint; `NOT_VALIDATED`.

## 13. Security and tenancy
Server-side dataset resolution; cross-org get 404; client cannot override provenance; no secrets.

## 14. Test results
Engine 4 dataset tests (incl. fingerprint); API 2 dataset tests (binding, immutability, isolation); full engine **1536 pass**, API **103 pass + 1 opt-in**, Vitest **560 pass**, dataset live E2E 1 pass; lint/boundaries/arch/typecheck/build/bundle pass.

## 15. Live verification
Browser: assemble → create run from dataset → run id/fingerprint; real API/dev DB.

## 16. Independent review (Nemotron 3 Ultra)
Binding/tenant/snapshot/canonicalization sound; snapshot survives dataset mutation; no scientific overclaim; migration additive; git/DB safe. Findings: execution reproducibility not established; dataset immutability is convention, not DB-enforced. Accepted with limitations.

## 17. Limitations
No model execution reproducibility; dataset mutable at DB level (snapshot protects runs); mappings limited to two models; no scientific validation.

## 18. Remaining blockers
Deterministic execution environment; dataset immutability/versioning; broader mappings; validation.

## 19. Reproducibility achieved
Input snapshot + fingerprint are reproducible/inspectable; identical canonical inputs → identical fingerprint.

## 20. Not yet achieved
End-to-end run reproducibility (execution), dataset version immutability, environment pinning.

## 21. Final classification
`SCIENTIFIC_DATASET_RUN_BINDING_COMPLETED_WITH_LIMITATIONS`.
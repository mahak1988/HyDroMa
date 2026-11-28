# Phase 3.76 — HyDroMA Readiness Data Quality & Provenance Report

## Baseline / final HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` → unchanged · branch `main`. No Git mutations.

## Files created / modified
- `services/api/src/server.mjs` — extended `computeReadiness` with deterministic `findings`, `provenance`, `spatial`.
- `packages/api-client/src/client.ts` — readiness return type + findings/provenance/spatial.
- `apps/platform/src/sections/agriculture/ReadinessModule.tsx` — quality findings, provenance, spatial, notice.
- `services/api/tests/quality.test.mjs` (new).
- Report.

## Architecture reused
Existing readiness contract (v1.0.0), assessment/review persistence (3.75), resources, org/RBAC, client/hooks/UI. No new endpoint/schema/service; historical snapshots untouched.

## Data-quality rules (deterministic, versioned)
Findings {id, category, severity, source, field, reason, expected, actual, rulesVersion} from:
- unit conflicts (irrigation unit ≠ mm) — high;
- temporal (out-of-season) — medium;
- relationship (cropCycle.farmMismatch) — high;
- consistency (duplicate irrigation same occurredAt+quantity) — low.
No invented agronomic/scientific bounds; data-quality ≠ scientific invalidity.

## Provenance / spatial
provenance = available | incomplete | unavailable (based on source presence + event dates + missing). spatial = available only if farm has geometry/coordinates, else unavailable (no geocoding/invention).

## Readiness semantics
State logic unchanged (READY_FOR_REVIEW iff no missing/invalid/unit/temporal). Quality findings are additive and do not upgrade state. Snapshots preserve findings + rulesVersion; fingerprint unchanged (currentness stable).

## Frontend
Readiness page shows provenance, spatial, and a findings list (category/field/reason/severity) + notice
"DATA QUALITY & READINESS ASSESSMENT ONLY — SCIENTIFIC EXECUTION AND VALIDATION NOT AUTHORIZED". Responsive, fa/en/ar.

## Security
Org isolation/RBAC unchanged; read-only sources; no execution endpoint; `GET /v1/users` untouched; no scientific status change.

## Tests (executed)
typecheck 0 · lint 0 · check:boundaries 0 · build 0 · unit **536** · backend `quality`+`readiness-review` **2/2**
(unit/duplicate/provenance/spatial/versioned/snapshot; real SQLite) · browser E2E readiness **2/2**.

## Limitations
Fingerprint covers contract inputs only; spatial checks minimal (no CRS/geometry validation beyond presence);
provenance partial by nature; no scientific validation/execution; no production/WCAG claims.

## Manifest
`manifest.sha256` (6 files) verified.

## Classification
`HYDROMA_READINESS_DATA_QUALITY_AND_PROVENANCE_IMPLEMENTED_AND_VERIFIED_WITH_LIMITATIONS`.
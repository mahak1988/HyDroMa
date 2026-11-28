# Architecture Guardrails (Executable)

**Status:** IMPLEMENTED (Phase 3.60). Minimal, deterministic, dependency-free.

## What is enforced
| Rule | Scope | Check | Status |
|---|---|---|---|
| HyDroMA independence | `engines/hydroma` | must not import apps, frontend `@eco-nojin/*` packages, `services/*`, or escape its tree | ENFORCED |
| Backend independence | `services/api` | must not import apps, frontend packages, or `engines/*` | ENFORCED |
| App/package/frontend→layer | apps + packages | `scripts/check-boundaries.mjs` (pre-existing) | ENFORCED (existing) |
| Contract framework | — | not added (no need) | NOT ENFORCED (documented) |

## Usage
- `pnpm run check:arch` — guardrails (HyDroMA + backend independence).
- `pnpm run test:arch` — tests incl. violation-detection fixtures.
- `pnpm run check:boundaries` — existing app/package boundaries.

## Design
Deterministic, no new dependencies, skips `tests/`/`__tests__`/build dirs, exit 1 on violation with a
clear message. Complements (does not duplicate) `check-boundaries.mjs`. Test fixtures prove both clean
pass and violation detection. See `docs/reports/phase-3.60-architecture-guardrails-report.md`.
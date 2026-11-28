# Phase 3.60 — Architecture Guardrails Report

## Baseline HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (verified locally). Branch `main`.

## Final HEAD
`3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (unchanged). No Git mutations.

## Git status before/after
- Before: 94 uncommitted paths (21 tracked-modified incl. prior Phase 3.60 `package.json`; 73 untracked incl. prior partial guardrail scripts). Not a clean tree.
- After: 97 uncommitted paths. Delta = this mission's additive files only:
  - `scripts/architecture-guardrails.mjs` (completed/generalized)
  - `scripts/architecture-guardrails.test.mjs` (added nested-service test → 6 tests)
  - `docs/architecture/architecture-guardrails.md` (rule documentation)
  - `docs/reports/phase-3.60-architecture-guardrails-report.md` (this report)
  - `package.json` (wired `check:arch` + `test:arch` into `verify`)
- No staged files, no deletions, no source relocated. Pre-existing changes preserved.

## Existing architecture checks examined
- `scripts/check-boundaries.mjs` (`check:boundaries`): app↔app, package→app, frontend→engines/services/contracts/etc., ui/i18n→frontend-core cycle. **21 units, 545 files, 0 violations.**
- `engines/hydroma/tests/test_boundaries.py`: Python import isolation (no apps/services, no forbidden third-party, api-vs-scientific deps, catalogue independence).
- `scripts/check-bundle-budget.mjs`, `check-tokens.mjs`, `app-manifest.mjs`, vitest, playwright, `test:api`.
- `verify` pipeline in `package.json`; `.github/workflows/verify.yml`.

## Implemented guardrails (ENFORCED — executable check exists)
1. **Frontend unit isolation** — `check-boundaries.mjs` (pre-existing, retained, not duplicated).
2. **HyDroMA independence (R1)** — `engines/hydroma` JS/TS must not import `apps/*`, `@eco-nojin/*` frontend packages, `services/*`, or escape its tree. `check:arch`.
3. **Backend independence (R2)** — `services/*` (generalized from `services/api` to all services) must not import `apps/*`, `@eco-nojin/*`, or `engines/*`. `check:arch`.
4. **Guardrail self-test** — `test:arch` (6 node tests on isolated fixtures).
5. **HyDroMA Python isolation** — `test_boundaries.py` (pre-existing, retained).

## Enforcement scope
| Rule | Check | Scope | Level |
|---|---|---|---|
| Frontend isolation | check:boundaries | 21 apps/packages | Enforced |
| HyDroMA independence | check:arch R1 | engines/hydroma JS/TS | Enforced |
| Backend independence | check:arch R2 | services/* JS/TS | Enforced |
| HyDroMA Python isolation | test_boundaries.py | engines/hydroma Py | Enforced (pytest) |
| Guardrail detection | test:arch | fixtures | Enforced |

## Files created
- `scripts/architecture-guardrails.mjs` (module + CLI; R2 generalized to `services/*`).
- `scripts/architecture-guardrails.test.mjs` (6 tests).
- `docs/architecture/architecture-guardrails.md`.
- `docs/reports/phase-3.60-architecture-guardrails-report.md`.

## Files modified
- `package.json` — `verify` now runs `check:arch` + `test:arch` (scripts `check:arch`/`test:arch` already present from prior partial attempt; this mission wired them into `verify`).

## Integration with existing verification
`pnpm run verify` = typecheck → lint → check:boundaries → **check:arch** → **test:arch** →
check:tokens → check:apps → test → test:api → build:all → check:bundle. No parallel CI, no new deps.

## Tests executed & results
- `node scripts/check-boundaries.mjs` → exit 0 (545 files / 21 units).
- `node scripts/architecture-guardrails.mjs` → exit 0 (5 files).
- `node --test scripts/architecture-guardrails.test.mjs` → 6 pass / 0 fail.
- `pnpm run check:arch` → exit 0; `pnpm run test:arch` → 6 pass / 0 fail.
- `pnpm run typecheck` → exit 0.

## Evidence of violation detection
- Real CLI: injecting `import '@eco-nojin/ui';` into `services/api/src/__archguard_probe.mjs`
  → `check:arch` exit `1`: `backend imports a frontend package`. Probe removed → exit `0`.
- Fixtures (`test:arch`): clean tree passes; HyDroMA→frontend pkg, HyDroMA→app + tree escape,
  backend→frontend pkg/engine, nested service (`services/edi`)→engine all flagged; test dirs ignored.

## Limitations
- Static import scan only; dynamic/indirect/runtime deps not resolved.
- `check:arch` scans JS/TS only; Python backend `services/edi` not covered by it (out of JS scope).
- Not a full enforcement system (no contract/DB/IAM/scientific enforcement).

## Unimplemented rules
- Contract-bypass enforcement — no contract framework exists (documented only).
- Cross-module table-access within a future modular monolith — no backend domain modules exist.
- `services/edi` (Python) boundary — not implemented (JS guardrail scope).

## Preservation confirmation
HEAD/branch unchanged; no commit/push/pull/merge/rebase/branch/tag/remote/deploy; no source
relocated, renamed or deleted; the probe file was removed; all pre-existing changes intact; only
additive files + `package.json` verify wiring.

## Classification
`ARCHITECTURE_GUARDRAILS_IMPLEMENTED_WITH_LIMITATIONS`
(Two reverse-direction executable guardrails + self-tests + verify integration + retained existing
boundary checks; static analysis only; not full architecture enforcement; no production/scientific claims.)
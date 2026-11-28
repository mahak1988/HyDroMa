# Architecture Guardrails — Executable Enforcement (Phase 3.60)

**Status:** IMPLEMENTED (enforced subset). This documents only the **executable** rules. It is not an
architecture catalog or roadmap. Authoritative dependency rules: [dependency-map.md](./dependency-map.md).

## What is enforced (executable check exists)

| Rule | Check | Scope | Level |
|---|---|---|---|
| Frontend unit isolation (no cross-unit relative escapes; app↔app; package→app; frontend→engines/services/contracts/etc.; ui/i18n→frontend-core cycle) | `scripts/check-boundaries.mjs` (`check:boundaries`) | 21 apps/packages | Enforced |
| HyDroMA independence (engine must not import apps/*, `@eco-nojin/*` frontend packages, services/*, or escape its tree) | `scripts/architecture-guardrails.mjs` R1 (`check:arch`) | `engines/hydroma` JS/TS | Enforced |
| Backend independence (`services/*` must not import apps/*, `@eco-nojin/*`, or engines/*) | `scripts/architecture-guardrails.mjs` R2 (`check:arch`) | `services/*` JS/TS | Enforced |
| HyDroMA Python import isolation (no apps/services; no forbidden third-party; api vs scientific deps; catalogue independence) | `engines/hydroma/tests/test_boundaries.py` | `engines/hydroma` Python | Enforced (pytest) |
| Guardrail self-test (violation detection on isolated fixtures) | `scripts/architecture-guardrails.test.mjs` (`test:arch`) | fixtures | Enforced |

## Integration

`pnpm run verify` runs: typecheck → lint → check:boundaries → **check:arch** → **test:arch** →
check:tokens → check:apps → test → test:api → build:all → check:bundle.

No parallel CI pipeline was created; the existing `verify` script and `.github/workflows/verify.yml`
are the single entry point. No new dependencies were added.

## Violation detection (evidence)

Injecting `import '@eco-nojin/ui';` into `services/api/src/__archguard_probe.mjs` made
`check:arch` exit `1` with `backend imports a frontend package`; removing the probe restored exit `0`.
Unit fixtures in `test:arch` cover clean-tree pass, HyDroMA→frontend, HyDroMA→app+escape,
backend→frontend/engine, nested-service→engine, and test-dir ignore.

## Documented only / not implemented

- Contract-bypass enforcement (no contract framework exists yet) — **not implemented**.
- Cross-module table-access enforcement inside a future modular monolith — **not implemented**
  (no backend domain modules exist).
- Python backend (`services/edi`) boundary check — **not implemented** (only `services/api` JS scanned
  by `check:arch`; `services/edi` is Python and out of the JS guardrail's scope).

See the final report for the full limitation list:
[../reports/phase-3.60-architecture-guardrails-report.md](../reports/phase-3.60-architecture-guardrails-report.md).
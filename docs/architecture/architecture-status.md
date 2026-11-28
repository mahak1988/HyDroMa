# Architecture Status & Maturity Vocabulary

**Status:** SCAFFOLDED. This is the single place that defines maturity vocabulary and records the
verified status of each major component. It is evidence-based: a component is only listed at a level
for which evidence exists in the repository.

## 1. Two independent maturity axes

### 1.1 Software maturity (per component)

| Level | Meaning | Evidence required |
|---|---|---|
| `PLANNED` | Not started; only intended | an entry in a registry/decision |
| `SCAFFOLDED` | Directory/boundary + README exist | boundary README present |
| `STUB` | Minimal non-functional placeholder | code that returns fixed/empty data |
| `IMPLEMENTED` | Real code, runs locally | build/typecheck/tests pass locally |
| `TESTED` | Automated tests cover it | test suite green |
| `VERIFIED` | Independent check reproduced the claim | recorded verification |
| `VALIDATED` | Meets acceptance against real requirements | acceptance record |
| `PRODUCTION_APPROVED` | Owner-approved for production | owner sign-off |

### 1.2 Scientific status (per model / dataset)

`UNCALIBRATED` · `CALIBRATED` · `VALIDATED` · `NOT_VALIDATED`

**Passing software tests never promotes scientific status** (D-HYDROMA-04). The two axes are never
merged.

## 2. Verified component status (evidence-based)

| Component | Home | Software maturity | Scientific status | Evidence |
|---|---|---|---|---|
| Unified frontend platform | `apps/platform` | IMPLEMENTED (demo/real-session) | n/a | 130+ routes, 385 e2e, one origin :5180 |
| Brand design showcase | `apps/brand` | IMPLEMENTED | n/a | static token showcase |
| Shared packages (13) | `packages/*` | IMPLEMENTED | n/a | i18n 530 keys × fa/en/ar, money, permissions, spatial, scientific |
| Local API | `services/api` | IMPLEMENTED (local) | n/a | `services/api/tests` |
| EDI component | `services/edi` | IMPLEMENTED (Python) | n/a | `services/edi/tests`, pyproject |
| Business services (13 domains) | `services/*` | SCAFFOLDED | n/a | boundary README only |
| HyDroMA engine | `engines/hydroma` | TESTED (1542 pytest) | NOT_VALIDATED | two-axis maturity in engine README |
| AI workforce | `engines/ai-workforce` | SCAFFOLDED | n/a | documents only, 6 roles |
| Contracts | `contracts/*` | SCAFFOLDED | n/a | no operational instance |
| Databases | `databases/*` | SCAFFOLDED | n/a | nothing installed |
| Infrastructure | `infrastructure/*` | SCAFFOLDED | n/a | definitions only |
| Integrations | `integrations/*` | SCAFFOLDED | n/a | adapters documented, no credentials |
| Workflows | `workflows/*` | SCAFFOLDED | n/a | definitions only |
| Data zones | `data/*` | SCAFFOLDED | n/a | structure + .gitignore |
| Tests (root layers) | `tests/*` | SCAFFOLDED | n/a | runner config present (vitest/playwright) |
| CI | `.github/workflows` | IMPLEMENTED | n/a | `verify.yml` runs gates |

> Note: the root `README.md` reports 309 unit + 385 e2e tests and a `verify` gate; those are the
> authoritative counts. This table records maturity, not counts.

## 3. What is explicitly NOT claimed

- No backend domain module is implemented (only `services/api`, `services/edi`).
- No database, schema, migration or seed exists.
- No scientific model is validated.
- No AI agent is activated; no provider credential exists.
- No payment, wallet or token feature is live.
- The platform is not deployed and not production-ready.

## 4. How to update this file

When a component advances a level, record the evidence (command + result, or artefact path) and
update the row. Never advance a level without evidence. Scientific status changes require
observational evidence and independent review, not tests.
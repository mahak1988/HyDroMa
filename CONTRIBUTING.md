# Contributing to Eco Nojin / HyDroMA

> این مخزن، مونوریپو پلتفرم یکپارچه اکو نوژین و موتور علمی HyDroMA است. سند راهبردی پروژه
> [Master Blueprint v1.0](docs/blueprint/ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md) است و قواعد
> نهایی توسعه در [AGENTS.md](AGENTS.md) ثبت شده است. این سند، خلاصه عملیاتی همان قواعد است؛
> در تعارض، AGENTS.md و ADRها معتبرند.

## Model of capability status

Every capability is classified as `VISION` / `DESIGNED` / `IMPLEMENTED` / `VERIFIED`
(see [docs/blueprint/README.md](docs/blueprint/README.md)). This is separate from the
scientific maturity ladder of models (`STUB → IMPLEMENTED → TESTED → VERIFIED → VALIDATED →
PRODUCTION_APPROVED`) and from the scientific validation status. **All HyDroMA models are
`NOT_VALIDATED`; never present a software test as scientific validation.**

## Non-negotiable rules (from AGENTS.md)

1. A service owns its data; other domains read through `contracts/`, never through tables.
2. `engines/*` never import services and are never imported by services; the frontend reaches
   science through the package contract (`packages/scientific`), never through `engines/`.
3. Every scientific result carries units, model version, data source, provenance and uncertainty.
4. Multi-tenant by default: every row is organization-scoped, every query filters by it.
5. fa/ar/en and real RTL from the first screen; strings come from `packages/i18n` (15 shipped
   locales — keep parity; no hardcoded UI strings).
6. UI decisions go through design tokens (`packages/ui`, `brand/`), not hardcoded values.
7. Demo data stays demo: isolated, never presented as real or validated.
8. At this stage: no Docker, no external database servers (services/api uses `node:sqlite`),
   no payments/wallets/tokens, no AI agent tool connections — each needs a separate owner
   decision + ADR.
9. Git: no `force-push`, no `rebase`, no `reset --hard` on shared branches. Commits/pushes are
   made only on explicit owner request. `upstream-archives/` and `upstream-registry/` are
   read-only evidence.
10. No secrets, keys or credentials in code, logs, tests or reports.

## Setup

- Node.js `>=22.12` (CI runs Node 24) and pnpm `12.18` (`corepack enable`)
- Python 3.12 for the scientific engine

```bash
pnpm install --frozen-lockfile
pnpm run dev          # unified host: http://localhost:5180
pnpm run verify       # typecheck → lint → boundaries → arch guardrails → arch tests → tokens → apps → tests → api tests → build → bundle budget
pnpm run test:api     # services/api suite (real persistence, auth, RBAC; runs the whole services/api/tests/ directory)
pip install -e "engines/hydroma[api,test]"
pytest engines/hydroma/tests
```

## Quality gates

### CI (`.github/workflows/verify.yml`) — runs on every push to `main` and every PR

| Gate | Command |
|---|---|
| Typecheck | `pnpm run typecheck` |
| Lint | `pnpm run lint` |
| Architecture boundaries | `pnpm run check:boundaries` |
| Design tokens | `pnpm run check:tokens` |
| App manifest consistency | `pnpm run check:apps` |
| Unit tests | `pnpm exec vitest run` |
| API service tests | `pnpm run test:api` (whole `services/api/tests/` suite: auth, RBAC, tenant isolation, rate limit, security, runs integrity, engine gateway/execution, rewards, EcoCoin ledger, …) |
| Build every app | `pnpm run build:all` |
| HyDroMA Python regression | `pytest engines/hydroma/tests` (includes offline `connect` suite and core boundary tests) |

### Local chain (`pnpm run verify`)

`typecheck → lint → check:boundaries → check:arch → test:arch → check:tokens → check:apps →
test → test:api → build:all → check:bundle`

Note: the architecture-guardrails gates (`check:arch`, `test:arch`) and the bundle budget
(`check:bundle`) currently run in the local chain but are **not yet** wired into the CI
workflow steps — see the `blueprint-track` issues.

## Branches and pull requests

- Work on short-lived feature branches off `develop`; `main` is the integrated branch.
- Open a PR with the provided template; all CI gates must pass before review.
- Use Conventional Commits: `feat(scope): …`, `fix(scope): …`, `docs(…): …`, `chore(…): …`,
  `refactor(…): …`, `test(…): …` (matching existing history).
- Merges are merge commits; history is never rewritten.

## Where new documentation goes

The narrowest correct place only — a second copy of an existing standard is a defect (ADR-0001):

- Decisions → `docs/adr/` (process in `docs/adr/README.md`)
- Strategy, goals, status → `docs/blueprint/`
- Runtime/architecture guides → `docs/architecture/`
- Governance scopes → `docs/security/`, `docs/data-governance/`, `docs/scientific-governance/`

## Reporting bugs and proposing features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. Feature requests that touch capability
status must reference the G01–G16 goals, propose a classification, and describe the evidence
needed before the status can be raised.

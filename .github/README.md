# .github — repository automation

**Status:** ACTIVE — CI runs on every push to `main` and every PR; templates configured.
**Authority:** root `README.md`, `AGENTS.md`, ADR register (`docs/adr/README.md`).

## Workflows

- [`workflows/verify.yml`](workflows/verify.yml) — typecheck, lint, architecture
  boundaries, design tokens, app-manifest consistency, unit tests, the full
  `services/api` test suite (auth, RBAC, tenant isolation, rate limit, security,
  runs integrity, engine gateway/execution, rewards, EcoCoin ledger, …), build of
  every app, and the HyDroMA Python regression suite (`pytest engines/hydroma/tests`,
  including the offline `connect` suite and core boundary tests).
- The local `pnpm run verify` chain additionally runs `check:arch`, `test:arch` and
  `check:bundle` — these gates are not yet wired into CI steps (tracked under the
  `blueprint-track` issues).

No secrets are configured in this phase. New automation (workflows, actions, bots)
requires an ADR and owner approval before landing.

## Templates

- [`PULL_REQUEST_TEMPLATE.md`](PULL_REQUEST_TEMPLATE.md) — summary, related work,
  evidence gates and the honesty checklist (demo vs real, `NOT_VALIDATED` models,
  multi-tenancy, i18n, boundaries).
- [`ISSUE_TEMPLATE/bug_report.md`](ISSUE_TEMPLATE/bug_report.md) — reproducible
  evidence required, no secrets in logs.
- [`ISSUE_TEMPLATE/feature_request.md`](ISSUE_TEMPLATE/feature_request.md) — must map
  to the G01–G16 goals and the four-state capability model
  (VISION / DESIGNED / IMPLEMENTED / VERIFIED).
- [`ISSUE_TEMPLATE/config.yml`](ISSUE_TEMPLATE/config.yml) — routes security reports
  to [`SECURITY.md`](../SECURITY.md).

Execution tracks are recorded as issues labeled `blueprint-track`.

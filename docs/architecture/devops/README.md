# DevOps & CI/CD Architecture

**Status:** SCAFFOLDED. Existing local CI scripts preserved (`pnpm typecheck/lint/test/build`, `check:*`).

## Responsibility
Environments (dev/test/staging/prod), CI, CD, build, security scanning, release, rollback, versioning.

## Boundaries
- Preserve existing CI; no deployment performed.
- No remote/branch/tag operations.

## Dependencies
All components; infrastructure.

## Maturity / Future
SCAFFOLDED → staged pipelines when Stage 6 begins; deployment owner-gated.
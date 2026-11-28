# Security Policy

## Supported versions

| Branch | Version | Supported |
|---|---|---|
| `main` | 0.1.0 (alpha, untagged) | yes |
| `develop` | integration | best effort |

The project is in early development; only the latest state of `main` receives fixes.

## Reporting a vulnerability

Please report vulnerabilities **privately** — do not open a public issue:

1. Preferred: GitHub **Security → Report a vulnerability** (private advisory) on this
   repository.
2. Otherwise, contact the repository owner [@mahak1988](https://github.com/mahak1988).

Include: description, affected component, reproduction steps, and (if possible) a minimal
proof of concept. Please give a reasonable time for a fix before any public disclosure.

## Scope

In scope:

- `services/api` — session authentication, RBAC (5 roles), organization scoping,
  audit logging, resource endpoints (`/v1/*`), `node:sqlite` persistence.
- `apps/platform` + unified host (`scripts/unified-*.mjs`) — SPA sections, session
  handling, same-origin API access.
- `engines/hydroma` — Python engine API surface and scientific run handling.
- `packages/*` — clients (`api-client`, `auth-client`), validation, configuration.

Out of scope (nothing exists yet or explicitly blocked by owner rules):

- Infrastructure/deployment (`infrastructure/` is not provisioned; no Docker).
- Payment, wallet, token or HIC financial flows — none exist; the HIC status endpoint is
  `INACTIVE`, non-issuable, non-transferable, non-convertible and non-financial by design.
- Third-party services, secrets handling outside the repository, social engineering.

## Security expectations in code (from AGENTS.md)

- Never commit secrets, keys or credentials (code, logs, tests, reports, fixtures).
- Demo data is isolated and never mixed with real data.
- Multi-tenant by default: every row is organization-scoped; queries must filter by it.
- Authorization is checked server-side; frontend state is never a security boundary.

## Response

Fixes land as normal PRs through the CI gates in `.github/workflows/verify.yml`;
response time is best-effort given the alpha stage of the project.

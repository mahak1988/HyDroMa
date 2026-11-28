---
name: Bug report
about: Something in the repository does not work as its documented capability claims
title: "bug: "
labels: ["bug"]
---

Thank you for reporting a bug. Before opening this issue, please read
[AGENTS.md](../blob/main/AGENTS.md) and [CONTRIBUTING.md](../blob/main/CONTRIBUTING.md):
this project distinguishes strictly between implemented, demo-only and designed-only
capabilities. Please do not report demo data (marketplace, tourism) or the inactive HIC
as broken financial features — they are documented as non-functional by design.

## What happened

A clear description of the behaviour you observed.

## Expected behaviour

What the documented capability says should happen (link the doc or module).

## Reproduction

Steps, repository state (commit SHA), and the command used, e.g.:

```
git checkout <SHA>
pnpm install --frozen-lockfile
pnpm run verify        # or the failing subset, e.g. pnpm run test:api
```

## Evidence

- Relevant log output / test failure (trimmed)
- Screenshots only if they add information

## Environment

- OS / Node version (`node --version`) / pnpm version (`pnpm --version`)
- Affected area: `apps/platform` / `services/api` / `engines/hydroma` / `services/edi` / `packages/*`

## Additional context

Anything else that helps reproduction. No scientific validation is claimed by any model
in this repository; scientific status is tracked separately in `docs/scientific-governance/`.

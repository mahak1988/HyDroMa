---
name: Capability proposal / feature request
about: Propose a new capability or a status change for an existing one
title: "capability: "
labels: ["enhancement"]
---

Proposals in this repository follow the blueprint governance: capabilities move through
`VISION → DESIGNED → IMPLEMENTED → VERIFIED` (see
[docs/blueprint/README.md](../blob/main/docs/blueprint/README.md)), and only the project
owner changes a capability's status. Agents and contributors may propose; the owner decides.

## Which goal does this serve?

Reference the master blueprint goal(s), e.g. `G05` (smart water management), and the
relevant priority from `docs/blueprint/ROADMAP-ALIGNMENT.md`.

## Current state (be honest)

- What exists today in the repository (modules, tests, docs) — cite paths.
- Current capability status: `VISION` / `DESIGNED` / `IMPLEMENTED` / `VERIFIED`.

## Proposal

What should change, at what layer:

- [ ] `apps/platform` (frontend section)
- [ ] `services/api` (backend module)
- [ ] `engines/hydroma` (scientific engine — note: scientific models remain `NOT_VALIDATED`;
      validation ladder changes go through `docs/scientific-governance/`, not here)
- [ ] `services/edi` (environmental data integration)
- [ ] `packages/*` (shared libraries)
- [ ] Documentation only

## Non-negotiables (from AGENTS.md)

- Demo data must never be presented as real, tested data.
- No financial operations, no tradable tokens, no payment flows; HIC stays `INACTIVE`
  unless the owner explicitly authorises otherwise in a separate decision.
- A second copy of an existing standard is a defect (ADR-0001) — propose indexing instead.

## Acceptance evidence

What reproducible evidence would justify the new status (tests, gates, review, benchmark)?

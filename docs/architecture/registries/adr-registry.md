# ADR Registry

**Status:** SCAFFOLDED index. The authoritative ADR process and files live in `docs/adr/`. This
registry mirrors the index for discoverability from the architecture set and defines the ADR format.
It does not duplicate ADR bodies.

## ADR format (normative)

Each ADR file (`docs/adr/ADR-####-short-title.md`) contains:

- **ID** — sequential, never renumbered.
- **Title** — short.
- **Status** — `PROPOSED` · `ACCEPTED` · `REJECTED` · `SUPERSEDED`.
- **Context** — forces at play.
- **Decision** — what was chosen.
- **Alternatives** — options considered.
- **Consequences** — trade-offs, follow-ups.
- **Dependencies** — components/decisions affected.
- **Date.**
- **Review requirements** — what evidence/owner sign-off is needed.

Only the project owner may move a decision to `ACCEPTED`. Decisions not yet closed remain in
`ARCHITECTURE-DECISIONS-OPEN.md` and are **not** ADRs.

## Accepted ADRs (mirror of docs/adr/README.md)

| ADR | Title | Status | Date |
|---|---|---|---|
| ADR-0001 | Documentation single source (`architecture/` authoritative, `docs/` process) | ACCEPTED | 2026-11-18 |
| ADR-0002 | One origin, one port, unified entry point | ACCEPTED | 2026-11-20 |
| ADR-0003 | Visual Identity v1.1 (Royal Aubergine) single token source | ACCEPTED | 2026-11-20 |
| ADR-0004 | Map base | ACCEPTED | — |
| ADR-0005 | i18n & RTL | ACCEPTED | — |
| ADR-0006 | State & data | ACCEPTED | — |
| ADR-0007 | UI kit | ACCEPTED | — |
| ADR-0008 | Plugin shell | ACCEPTED | — |
| ADR-0009 | Scope: field collection | ACCEPTED | — |
| ADR-0010 | Unified platform sections | ACCEPTED | — |

> Verify current statuses against `docs/adr/README.md` (the source of truth); this table is a mirror.

## Open decisions (not ADRs)

Tracked in `ARCHITECTURE-DECISIONS-OPEN.md` (D-GIT-01, D-ARC-01/02, D-APP-01/02, D-FE-01, D-04,
D-DB-01/02, D-QA-01, D-INT-01/02, D-17, D-DOC-01, D-PROD-01/02, D-AI-01, D-HYDROMA-01..06).

## Proposals vs decisions

A proposal (e.g. `ADR-DRAFT-UPSTREAM-001-xclim.md`) is **not** a decision. This registry never
presents a proposal as accepted.
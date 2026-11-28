# docs/adr/ — architecture decision records

**Status:** active. Accepted decisions are recorded here; decisions still
awaiting the owner stay in `../../ARCHITECTURE-DECISIONS-OPEN.md` until they
are closed in this register.

Process:
- One file per decision: `ADR-####-short-title.md`, sequential, never renumbered.
- Status is one of `PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`.
- Only the project owner may move a decision to `ACCEPTED`.
- An ADR records the decision and its consequences; it does not contain
  implementation instructions.
- No second version of an accepted standard: superseding requires a new ADR
  that explicitly marks the old one `SUPERSEDED`.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./ADR-0001-documentation-single-source.md) | Documentation single source (`architecture/` authoritative, `docs/` process) | ACCEPTED | 2026-11-18 |
| [ADR-0002](./ADR-0002-single-origin-unified-shell.md) | One origin, one port, unified entry point for every app | ACCEPTED | 2026-11-20 |
| [ADR-0003](./ADR-0003-visual-identity-v1-1.md) | Visual Identity v1.1 (Royal Aubergine) as the single token source | ACCEPTED | 2026-11-20 |
| [ADR-0004](./ADR-0004-map-base.md) | Map base: MapLibre GL JS 2D + deck.gl (client-only) | ACCEPTED | 2026-11-22 |
| [ADR-0005](./ADR-0005-i18n-rtl.md) | i18n/RTL standard: geolibre pattern + medusa schema | ACCEPTED | 2026-11-22 |
| [ADR-0006](./ADR-0006-state-data.md) | State/data standard: TanStack Query + React Router data router | ACCEPTED | 2026-11-22 |
| [ADR-0007](./ADR-0007-ui-kit.md) | UI Kit: single @eco-nojin/ui + design tokens | ACCEPTED | 2026-11-22 |
| [ADR-0008](./ADR-0008-plugin-shell.md) | Plugin shell: medusa Injection Zones + directus preRegisterCheck (pattern only) | ACCEPTED | 2026-11-22 |
| [ADR-0009](./ADR-0009-scope-field-collection.md) | Scope: field-collection app included; analytics/flow-builder deferred | ACCEPTED | 2026-11-22 |
| [ADR-0010](../architecture/ADR-0010-unified-platform-sections.md) | Unified platform sections (one SPA, lazy sections, one session, same-origin API, budget gate) | ACCEPTED | 2026-11-23 |
| [ADR-0011](./ADR-0011-master-blueprint-and-repo-standardization.md) | Master Blueprint adoption and repository standardization | ACCEPTED | 2026-11-28 |
| [ADR-DRAFT-UPSTREAM-001](./ADR-DRAFT-UPSTREAM-001-xclim.md) | Adopt xclim (climate indices) via original adapter | DRAFT — pending owner approval | 2026-11-21 |

Note: ADR-0010 lives in [`docs/architecture/`](../architecture/) together with
the platform architecture guides; the remaining ADRs live here.

Template: [`ADR-0000-template.md`](./ADR-0000-template.md).

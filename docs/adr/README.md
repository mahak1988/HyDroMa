# docs/adr/ — architecture decision records

**Status:** active. Process decisions and platform decisions are recorded here; decisions
still awaiting the owner stay in `../../ARCHITECTURE-DECISIONS-OPEN.md` until they are
closed here. Technology-selection ADRs for the scientific/map stack live in
`../architecture/adr/`.

Process:
- One file per decision: `ADR-####-short-title.md`, sequential, never renumbered.
- Status is one of `PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`.
- Only the project owner may move a decision to `ACCEPTED`.
- An ADR records the decision and its consequences; it does not contain implementation instructions.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./ADR-0001-documentation-single-source.md) | Documentation single source (`architecture/` authoritative, `docs/` process) | ACCEPTED | 2026-11-18 |
| [ADR-0002](./ADR-0002-single-origin-unified-shell.md) | One origin, one port, unified entry point for every app | ACCEPTED | 2026-11-20 |
| [ADR-0003](./ADR-0003-visual-identity-v1-1.md) | Visual Identity v1.1 (Royal Aubergine) as the single token source | ACCEPTED | 2026-11-20 |
| [ADR-0004](./ADR-0004-map-base.md) | Map base layer (MapLibre + raster/vector strategy) | ACCEPTED | 2026-11-22 |
| [ADR-0005](./ADR-0005-i18n-rtl.md) | Internationalization with full RTL support | ACCEPTED | 2026-11-22 |
| [ADR-0006](./ADR-0006-state-data.md) | Client state and data-fetching model | ACCEPTED | 2026-11-22 |
| [ADR-0007](./ADR-0007-ui-kit.md) | UI kit composition | ACCEPTED | 2026-11-22 |
| [ADR-0008](./ADR-0008-plugin-shell.md) | Plugin/shell architecture for sections | ACCEPTED | 2026-11-22 |
| [ADR-0009](./ADR-0009-scope-field-collection.md) | Scope of field collection | ACCEPTED | 2026-11-22 |
| [ADR-0010](../architecture/ADR-0010-unified-platform-sections.md) | Unified platform sections (one SPA, lazy sections) — recorded in `docs/architecture/` | ACCEPTED | 2026-11-23 |
| [ADR-0011](./ADR-0011-optional-environmental-connectors.md) | Optional environmental connectors (`connect` package) | ACCEPTED | 2026-11-27 |
| [ADR-0012](./ADR-0012-master-blueprint-and-repo-standardization.md) | Master Blueprint adoption and repository standardization | ACCEPTED | 2026-11-28 |
| [ADR-0013](./ADR-0013-ai-workforce-governance-layer.md) | AI Workforce governance layer (registry, permissions, hash-chained audit, policy, gateway contract); execution plane NOT_ACTIVE | ACCEPTED | 2026-11-29 |
| [ADR-DRAFT-UPSTREAM-001](./ADR-DRAFT-UPSTREAM-001-xclim.md) | Adopt xclim (climate indices) via original adapter | DRAFT — pending owner | 2026-11-21 |

Technology-selection series (MapLibre, CesiumJS, pgSTAC, Hydromt-wflow, connectors) is
indexed in [`../architecture/adr/`](../architecture/adr/).

Template: [`ADR-0000-template.md`](./ADR-0000-template.md).

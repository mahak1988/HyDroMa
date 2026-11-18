# ADR-0001 — Single source of truth for documentation

- **Status:** PROPOSED (owner confirmation required)
- **Date:** 2026-11-18
- **Deciders:** project owner
- **Related:** ROOT-STRUCTURE-MANIFEST, ARCHITECTURE-DECISIONS-OPEN (D-DOC-01)

## Context
`D:\Nojin` already contains architecture standards in `architecture/`, brand standards in
`brand/`, and upstream evidence in `upstream-registry/`. The requested root structure also
defines `docs/{architecture,adr,security,data-governance,scientific-governance,development}`.
Creating those folders as full document sets would duplicate existing standards and create two
competing authorities.

## Decision (proposed)
`docs/` holds **process and governance documents only** and indexes existing material; architecture
standards remain in `architecture/` until an explicit migration is approved. No document is copied.

## Consequences
- Positive: one authority per topic; no silent divergence between duplicates.
- Negative: two top-level doc locations during the transition.
- Follow-up: decide D-DOC-01 (consolidate into `docs/` or keep `architecture/` as authority).

# docs/adr/ — architecture decision records

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Process:
- One file per decision: `ADR-####-short-title.md`, sequential, never renumbered.
- Status is one of `PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`.
- Only the project owner may move a decision to `ACCEPTED`.
- An ADR records the decision and its consequences; it does not contain implementation instructions.

Template: `ADR-0000-template.md`. Decisions still awaiting the owner are tracked in
`../../ARCHITECTURE-DECISIONS-OPEN.md`; when one is decided, it becomes an ADR and the open entry
is closed with a reference.

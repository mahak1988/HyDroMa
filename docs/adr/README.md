# docs/adr/ — architecture decision records

**Status:** active. Two decisions are recorded; decisions still awaiting the owner stay in
`../../ARCHITECTURE-DECISIONS-OPEN.md` until they are closed here.

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

Template: [`ADR-0000-template.md`](./ADR-0000-template.md).
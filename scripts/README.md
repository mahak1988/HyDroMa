# scripts/ — project tooling

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

| Script | Purpose | Safe to run repeatedly |
|---|---|---|
| `scaffold-architecture.mjs` | creates the root skeleton directories and boundary READMEs | yes — never overwrites existing files |

Rules: scripts must be read before execution, must not require network by default, must not touch
`upstream-archives/` or `upstream-registry/<project>/` sources, and must print what they change.

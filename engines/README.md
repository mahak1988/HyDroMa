# engines/ — scientific and agent engines

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Engines are independent of business services: no engine imports `services/*`, and no service
imports engine internals. Communication happens through `contracts/*`.

- `hydroma` — the scientific engine (water, hydrology, soil, climate, agriculture, MRV, scenarios).
- `ai-workforce` — the agent runtime and registry.

Status: skeleton.

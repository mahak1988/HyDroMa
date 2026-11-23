# apps/scientific-workspace — HyDroMA UI

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Responsibility: the scientist-facing environment — data selection, scenario definition,
simulation monitoring, result inspection, provenance and uncertainty display, MRV evidence views.

Boundary:
- In: `engines/hydroma` contracts (`contracts/scientific-models`), `services/ai-orchestration`
  for agent-assisted analysis.
- Out: any numeric model execution, unit conversion authority, or provenance mutation.
- Rule: the UI must display units, model version, data source and uncertainty returned by the
  engine; it must never synthesize or hide them.

Status: skeleton.

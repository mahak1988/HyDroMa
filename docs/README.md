# docs/ — documentation map

**Status:** ACTIVE — process and governance documentation. Existing standards are indexed,
not duplicated (ADR-0001: a second copy of an existing standard is a defect).
**Authority:** root `README.md`, `AGENTS.md`, `ROOT-STRUCTURE-MANIFEST.md`.

| Topic | Authoritative location |
|---|---|
| Master Blueprint v1.0 — philosophy, G01–G16 goals, roadmap, vertical slices | [`blueprint/`](blueprint/) (adopted per ADR-0012) |
| Goal status matrix (G01–G16 with evidence) | [`blueprint/GOALS-STATUS-MATRIX.md`](blueprint/GOALS-STATUS-MATRIX.md) |
| Roadmap (phases 0–14, priorities, slices) mapped to reality | [`blueprint/ROADMAP-ALIGNMENT.md`](blueprint/ROADMAP-ALIGNMENT.md) |
| Architecture decision records (process register, ADR-0001…0012) | [`adr/`](adr/) — index in [`adr/README.md`](adr/README.md) |
| Technology-selection ADR series (MapLibre, CesiumJS, pgSTAC, …) | [`architecture/adr/`](architecture/adr/) |
| Architecture guides: overview, principles, C4, guardrails, registries | [`architecture/`](architecture/) |
| Frontend architecture (modules/routes registries, auth, migration) | [`architecture/frontend/`](architecture/frontend/) |
| Unified routing & platform sections (ADR-0010) | [`architecture/ROUTING.md`](architecture/ROUTING.md), [`architecture/ADR-0010-unified-platform-sections.md`](architecture/ADR-0010-unified-platform-sections.md) |
| Scientific engine docs & governance | [`scientific-governance/`](scientific-governance/), [`architecture/hydroma/`](architecture/hydroma/) |
| Security policy scope | [`security/`](security/) + root [`SECURITY.md`](../SECURITY.md) |
| Data governance scope | [`data-governance/`](data-governance/) |
| Development process | [`development/`](development/) |
| Phase & engineering reports (3.60–3.105, autonomous phases, audits) | [`reports/`](reports/), [`audits/`](audits/) |
| Ecosystem / boundary model (pre-monorepo baseline) | root `ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` |
| Brand, tokens, design system | `brand/` (repo root) |
| Upstream repository evidence and licences | `upstream-registry/` (repo root) |
| This mission's early deliverables | repository root (`*-REPORT.md`, `*-BASELINE.md`, `*-MANIFEST.*`) per `ROOT-STRUCTURE-MANIFEST.md` |

New documents go in the narrowest correct place. A second copy of an existing standard is
a defect. Strategic capability-status changes are made only in `docs/blueprint/`, with
owner approval and reproducible evidence.

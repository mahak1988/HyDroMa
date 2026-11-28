# HyDroMA Architecture (branch index)

**Status:** HyDroMA engine software-TESTED, scientifically **NOT_VALIDATED**. Authoritative depth:
`engines/hydroma/README.md`, `architecture/HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md`,
`architecture/HYDROMA-SCIENTIFIC-ENGINE-PHASE1-IMPL-CONTRACT.md`, `packages/scientific`.

## Boundaries

- Engine owns scientific computation + provenance; exposes HTTP/CLI contract only.
- Imports nothing from `apps/` or `services/`; reached via an engine gateway (backend) and
  `packages/hydroma-client` (frontend). Never embedded in backend/frontend.

## Contract elements

Model registry (id@version) · model contracts · input/output validation · explicit units (no silent
conversion) · model metadata · model/parameter versioning · data + scientific provenance (SHA-256) ·
uncertainty · calibration · validation · reproducibility (hash/replay) · execution + job management ·
result persistence · scientific status · error handling · testing.

## Two-axis maturity (never conflate)

- Software: `stub→implemented→tested→verified→validated→production_approved`.
- Scientific: `UNCALIBRATED / CALIBRATED / VALIDATED / NOT_VALIDATED`.
- Passing unit tests never promotes scientific status (D-HYDROMA-04). Water Balance = software
  `tested`, scientific `NOT_VALIDATED`.

## Scientific run lifecycle

Frontend → API → Backend → Engine gateway → HyDroMA → model execution → result → provenance →
persistence → API → Frontend. (See [../data-flow.md](../data-flow.md) for existing vs planned.)

## Current state

Implemented (Python, stdlib + FastAPI local): water balance, units, provenance, jobs, registry,
spatial, STAC, climate foundation, ET0, soil/crop/irrigation series, scenario, workflow, contracts,
experiment, compare, quality, ingest. 58+ pytest. No gateway, no distributed workers, not validated.

## Related

- [../component-registry.md](../component-registry.md) · D-HYDROMA-01..06, D-17
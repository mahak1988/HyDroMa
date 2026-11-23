# Phase 2.1 — Consolidated Requirements & Execution Map

**Status:** living consolidation (updated 2026-11-20). This is the single Phase 2.1
requirements reference; it does not create a competing roadmap. Source of truth order:
owner decisions > Architecture SoT > approved specs > accepted implementation decisions >
code/tests > research > historical reports.

**Scope:** HyDroMA Scientific Runtime Foundation (`engines/hydroma/`). Status labels:
`VERIFIED` (code+test), `TESTED`, `IMPLEMENTED`, `INCOMPLETE`, `DEFERRED`,
`OWNER-DECISION`.

## A. Requirements

| ID | Requirement | Source | Priority | Depends on | Target | Acceptance | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| R-2.1-01 | Independent Python runtime, decoupled from frontend | D-HYDROMA-01 (rec. A) | P0 | — | 2.1 | no import of apps/services; HTTP/CLI only | code review + tests | TESTED |
| R-2.1-02 | SQLite + filesystem persistence | D-HYDROMA-02 (rec. A) | P0 | R-2.1-01 | 2.1 | jobs survive restart | test_persistence_across_restart | TESTED |
| R-2.1-03 | Local worker + persisted job lifecycle | D-HYDROMA-03 (rec. A) | P0 | R-2.1-02 | 2.1 | queued→running→completed/failed; atomic claim; recover | test_jobs (claim/concurrent/recover) | TESTED |
| R-2.1-04 | Strict maturity gates; tests ≠ scientific validation | D-HYDROMA-04 (rec. A) | P0 | — | 2.1 | no auto-promotion; two axes | test_maturity | TESTED |
| R-2.1-05 | Water Balance model, faithful to TS + independent math tests | packages/scientific | P0 | R-2.1-01 | 2.1 | equation/parity/rounding/out-of-domain/closure | test_water_balance (independent expected values) | TESTED |
| R-2.1-06 | Explicit units contract (no silent conversion) | D-P20-13, science | P0 | — | 2.1 | known conversions; reject unknown/mismatch/non-finite | test_units | TESTED |
| R-2.1-07 | Provenance (SHA-256, schema_version, completeness, error path) | science, D-P20-13 | P0 | R-2.1-05 | 2.1 | deterministic hash; complete record; failed distinguishable | test_provenance | TESTED |
| R-2.1-08 | Model registry + definition validation (id@version, immutable) | D-P20-13 | P1 | — | 2.1 | reject malformed/duplicate definitions | test_registry | TESTED |
| R-2.1-09 | Local FastAPI (health/models/runs/provenance), structured errors | D-P20-12 (partial) | P1 | R-2.1-03 | 2.1 | 202/200/404/422; retrieval works | test_api | TESTED |
| R-2.1-10 | Local security boundary (loopback default) | security | P1 | R-2.1-09 | 2.1 | non-loopback refused without flag | test_local_boundary_helper | VERIFIED |
| R-2.1-11 | Model-definition JSON Schema as contract SoT | D-P20-13 | P2 | R-2.1-08 | 2.1+ | schema published; validated at registration | validate_definition + MODEL_DEFINITION_SCHEMA | IMPLEMENTED (full JSON Schema deferred) |
| R-2.1-12 | Approved dependency set (pinned, minimal) | D-P20-11 | P1 | — | 2.1 | fastapi/pydantic/pytest/httpx; stdlib sqlite3 | pyproject + lockfile | IMPLEMENTED (SQLAlchemy/Alembic deferred) |

## B. Deferred requirements (not in this work package)

| ID | Requirement | Reason | Trigger |
|---|---|---|---|
| D-2.1-01 | Authentication (OIDC) / MFA | owner decision D-04 / D-P20-12 | Phase 2.2 |
| D-2.1-02 | Multi-tenant enforcement (RLS) | owner decision D-P20-08 | Phase 2.2 |
| D-2.1-03 | Alembic migrations | schema stable; stdlib DDL sufficient | when schema evolves |
| D-2.1-04 | Scientific validation (datasets, calibration, review) | requires observations | post-MVP |
| D-2.1-05 | Additional scientific models (ET0, SCS-CN, etc.) | scope control | Phase 2.1 extension |
| D-2.1-06 | Distributed/concurrent job execution | not needed for local slice | Phase 2.2+ |

## C. Owner decisions referenced (NOT approved by agent)

D-P20-01 (scope/order), D-HYDROMA-01..04 (runtime/DB/worker/maturity — implemented per
recommended options, formal approval pending), D-P20-11 (deps), D-P20-13 (contract SoT),
D-P20-12 (API auth/tenant boundary — partial). Recommended options are **not** approvals.

## D. Verification summary

`py -m pytest` in `engines/hydroma` → **317 passed**. Covers units, water balance,
cross-language parity, FAO-56 ET0, soil water storage, daily root-zone dynamics,
crop ET (Kc/Ks/ETc) + daily chain, **irrigation scheduling**, provenance, maturity,
jobs, API, registry, verification, and the spatial/STAC/tiling/data/catalogue boundary.

## E. Addendum — interoperability & verification foundation

| ID | Requirement | Source | Priority | Depends on | Target | Acceptance | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| R-2.1-13 | Shared cross-language test vectors (JSON) + TS↔Python parity | WP-A | P0 | R-2.1-05 | 2.1 | vectors run in both langs; outputs agree | test_parity (15 vectors × 3) | TESTED (PASS) |
| R-2.1-14 | Physical constraints explicit (no silent clamp/discard) | WP-B | P0 | R-2.1-05 | 2.1 | balance holds; negative final = null + out-of-domain; residual/closure correct | test_physical_constraints | TESTED |
| R-2.1-15 | Process-level claim safety (independent connections) | WP-C | P1 | R-2.1-03 | 2.1 | exactly one winner across processes | test_jobs_process | TESTED (PASS) |
| R-2.1-16 | Provenance canonicalization + documented limits | WP-D | P1 | R-2.1-07 | 2.1 | stable/equal/unicode/nested; RFC 8785 non-equivalence documented | test_provenance | TESTED (cross-lang hash not claimed) |
| R-2.1-17 | Reusable model-execution contract (metadata) | WP-E | P1 | R-2.1-08 | 2.1 | definition covers MODEL_CONTRACT_FIELDS | test_registry::test_contract_completeness | TESTED |
| R-2.1-18 | Reusable verification foundation (distinct from validation) | WP-G | P1 | R-2.1-13 | 2.1 | run_vectors → PASS/FAIL/INCOMPLETE; never promotes maturity | test_verification | IMPLEMENTED+TESTED |
| R-2.1-19 | API local boundary verified from code | WP-F | P1 | R-2.1-09 | 2.1 | non-loopback refused without flag | test_api::test_non_loopback_binding_refused_without_flag | VERIFIED |
| R-2.1-20 | FAO-56 Penman-Monteith ET0 model + independent vectors | WP-4/5 | P0 | R-2.1-05/06 | 2.1 | 11 hand-derived FAO-56 vectors; runtime + API integration | test_fao56_et0 | TESTED (scientific NOT validated) |
| R-2.2-01 | Soil water storage & root-zone availability (multi-layer, explicit root-zone depth, partial layer intersection, units, coverage validation) | Phase 2.2 | P0 | R-2.1-06 | 2.2 | TAW/storage/available/depletion/RAW/depletion-fraction + stress diagnostic; layer ordering/coverage/unit validation; 17 hand-derived vectors | test_soil_water | TESTED (scientific NOT validated) |
| R-2.3-01 | Daily root-zone water dynamics (crop-neutral accounting) | Phase 2.3 | P0 | R-2.2-01 | 2.3 | daily conservation, excess rule, multi-day/scenario; 14 hand-derived vectors | test_daily_soil_water | TESTED (scientific NOT validated) |
| R-2.4-01 | FAO-56 crop ET (Kc/Ks/ETc) + physically-consistent daily chain | Phase 2.4 | P0 | R-2.3-01 | 2.4 | ETc=Kc·ET0, Ks (incl. p=1/TAW=0/boundaries), ETc_adj; additive chain with ET limited to water above WP, unmet demand reported separately, verified conservation; 19 hand-derived vectors + chain tests | test_crop_water | TESTED (scientific NOT validated) |
| R-2.5-01 | Irrigation scheduling (depletion-based, net/gross) | Phase 2.5 | P0 | R-2.4-01 | 2.5 | TAW/RAW/Dr, target, net=max(0,Dr-target), gross=net/eff; 18 hand-derived vectors | test_irrigation | TESTED (scientific NOT validated) |
| R-2.6-01 | Provenance `parameter_hash` integrity (real hash of model parameter object, not a placeholder) | Phase 2.6 | P1 | R-2.1-07 | 2.6 | `extract_model_parameters` + optional per-model `parameters` declaration; deterministic SHA-256; empty-object hash for models with no parameter object; input/result hashes unchanged; schema unchanged | test_provenance | TESTED |
| R-2.7-01 | Climate Data Foundation (source-independent observation/series contract) | Phase 2.7 | P1 | R-2.1-01 | 2.7 | observation/series/spatial/provenance types; 8 variables + canonical units; temporal bases; quality flags; missing-data policy; deterministic serialization; structured validation; stdlib-only | test_climate | TESTED (scientific NOT validated) |
| R-2.8-01 | Climate Dataset Import & Normalization (CSV/JSON → climate contract) | Phase 2.8 | P1 | R-2.7-01 | 2.8 | explicit ImportConfig; CSV headers+mapping; JSON climate-serialization contract; explicit conversions (degF/cm/kmh/fraction); strict date/timezone handling; missing→quality=missing (no zero-fill); quality mapping; structured ImportResult with partial success; per-variable duplicate/conflict fix in climate.validate_series | test_climate_import | TESTED (scientific NOT validated) |
| R-2.9-01 | Climate → FAO-56 ET0 integration (daily ET0 over ClimateSeries) | Phase 2.9 | P1 | R-2.8-01 | 2.9 | explicit climate→ET0 variable mapping (rn explicit, no silent Rs=Rn); ea derived from RH (documented); daily-basis enforcement; local-date preservation; quality policy (strict/allow_suspect); missing days reported not zero-filled; structured ET0SeriesResult; provenance (climate_series_hash + results_hash); existing FAO-56 model unchanged | test_climate_et0 | TESTED (scientific NOT validated) |
| R-3.0-01 | Climate-driven soil-water simulation integration (ClimateSeries → precip + ET0 → daily soil-water) | Phase 3.0 | P1 | R-2.9-01 | 3.0 | SoilWaterSeriesConfig; explicit precip mapping (unit/basis/quality); ET0 via climate_et0; local-date alignment; contiguous-prefix execution of existing daily_soil_water with stop-at-first-interruption; state propagation; missing/rejected/skipped/missing-dates; SoilWaterSeriesResult; provenance (climate_series_hash + results_hash); existing models unchanged | test_soil_water_series | TESTED (scientific NOT validated) |
| R-3.1-01 | Climate-driven crop-water simulation integration (ClimateSeries → precip + ET0 → crop-water stress → daily soil-water) | Phase 3.1 | P1 | R-3.0-01 | 3.1 | CropWaterSeriesConfig; reuse climate precip + ET0; sequential pre-day stress (Dr = S_FC − S) via existing crop_water.compute_crop_water → ETc_adjusted fed to existing daily_soil_water one day at a time; evolving Ks; state propagation; no double counting; stop-at-first-interruption; CropWaterSeriesResult; provenance (climate_series_hash + results_hash); existing models unchanged | test_crop_water_series | TESTED (scientific NOT validated) |
| R-3.2-01 | Climate-driven irrigation simulation integration (crop-water + irrigation policy) | Phase 3.2 | P1 | R-3.1-01 | 3.2 | IrrigationSeriesConfig; reuse climate precip + ET0 + crop water; irrigation policy (none/schedule_to_target/explicit); existing irrigation.compute_irrigation_schedule per day; recommendation vs application distinguished; net applied to soil (gross reported, losses not simulated); applied exactly once; max cap; state propagation; water balance; stop-at-first-interruption; IrrigationSeriesResult; provenance (climate_series_hash + all model ids/versions + results_hash); existing models unchanged | test_irrigation_series | TESTED (scientific NOT validated) |
| R-3.3-01 | Scenario Engine (define/validate/execute/compare scenarios) | Phase 3.3 | P1 | R-3.2-01 | 3.3 | ScenarioConfig (identity + explicit irrigation-series config); validate (unique ids, exactly one baseline, valid config); run_scenarios executes each scenario independently over common forcing (sequential, isolated initial state, failed scenario isolated); ScenarioSetResult; compare_scenarios with documented metrics + baseline differences + compatibility warnings; deterministic scenario config hash + climate hash + result hash; existing integrations reused unchanged | test_scenario | TESTED (scientific NOT validated) |
| R-3.4-01 | Scientific Workflow Layer (DAG orchestration of existing models/integrations/scenarios) | Phase 3.4 | P1 | R-3.3-01 | 3.4 | WorkflowDefinition/WorkflowStep (model/integration/scenario); validation (unique ids, deps, cycles, input-ref integrity, unsupported ops); deterministic topological order; explicit input resolution (workflow/upstream/literal); safe operation registry (no eval/exec); failure propagation (downstream skipped); WorkflowResult; provenance (workflow/input/step/result hash); example end-to-end workflow reusing existing integrations | test_workflow | TESTED (scientific NOT validated) |
| R-3.5-01 | Scientific data contracts & workflow I/O validation | Phase 3.5 | P1 | R-3.4-01 | 3.5 | contracts.py FieldSpec/DataContract/ValidationResult; contract registry for compute_et0_series/simulate_climate_{soil,crop,irrigation}/run_scenarios; input validation before execution, output validation after; contract-invalid inputs prevent execution, contract-invalid outputs prevent downstream consumption (CONTRACT_INPUT_INVALID/CONTRACT_OUTPUT_INVALID → downstream SKIPPED); independent steps preserved; contractless operations (model steps) explicit; validation in step provenance + result hash; structural/data only, not scientific | test_contracts | TESTED (scientific NOT validated) |
| R-3.6-01 | Scientific experiment & reproducibility artifacts | Phase 3.6 | P1 | R-3.5-01 | 3.6 | ExperimentDefinition (identity + WorkflowDefinition + tags/metadata); run_experiment validates definition + inputs, executes via Workflow Engine (preserving contract validation), returns ExperimentResult (COMPLETED/FAILED/PARTIAL/INVALID_DEFINITION); reproducibility artifact (schema version, definition/inputs/execution/provenance/validation, scientific_status NOT_VALIDATED); five deterministic hashes (definition/workflow/input/config/result/artifact, volatile excluded); validate_artifact; replay_experiment (reconstruct + re-execute, compare result_hash; UNAVAILABLE without inputs); safe serialization, no eval/exec | test_experiment | TESTED (scientific NOT validated) |
| R-3.7-01 | Experiment comparison & result inspection | Phase 3.7 | P2 | R-3.6-01 | 3.7 | compare_experiments (artifacts or ExperimentResult); independent compatibility dimensions (definition/workflow/input/configuration/engine/contract; IDENTICAL/DIFFERENT/INCOMPATIBLE/UNKNOWN/NOT_AVAILABLE); execution + per-step status comparison; result comparison (artifact=hash-level, ExperimentResult=path/value with raw numeric diff, type changes, non-finite excluded); provenance hash comparison; verify_artifact_integrity (recompute artifact_hash + input_hash); descriptive only, no scientific ranking/causal claims | test_compare | TESTED (scientific NOT validated) |
| R-3.8-01 | Scientific units & dimensional consistency | Phase 3.8 | P1 | R-3.7-01 | 3.8 | units.py extended with BaseDimension (L/M/T/Θ) + UnitDefinition registry (33 units); get_unit/list_units/is_known_unit/are_compatible/convert_value (affine)/convert_difference/validate_unit; FieldSpec.unit validated at runtime (UNIT_EXACT_MATCH/UNIT_COMPATIBLE/UNIT_INCOMPATIBLE/UNIT_UNKNOWN/UNIT_MISSING) without implicit conversion; workflow unit failures → CONTRACT_INPUT_INVALID (downstream skipped, independent continue); backward-compatible for fields without units; explicit conversion only; temperature absolute vs difference distinct | test_units_dimension | TESTED (scientific NOT validated) |
| R-3.9-01 | Scientific data quality & quality control | Phase 3.9 | P1 | R-3.8-01 | 3.9 | quality.py QualityFlag/QualityReport (serializable, deterministic canonical_hash); structural/numeric/unit/climate/spatial/temporal checks (rule IDs); QC policy (thresholds, blocking, unit_policy); LEGACY vs STRICT unit enforcement at contract + workflow level (STRICT UNIT_MISSING = error → step FAILED → downstream SKIPPED); assess_climate_quality workflow operation; effective policy in ValidationResult.step provenance + experiment artifact (replay-preserving); detect-and-report only (no mutation of observations) | test_quality | TESTED (scientific NOT validated) |
| R-3.10-01 | Climate data ingestion & quality-aware pipeline | Phase 3.10 | P1 | R-3.9-01 | 3.10 | ingest.py pipeline SOURCE→INGEST→NORMALIZE→VALIDATE→QC→ACCEPTANCE→MODEL-READY; reuses climate_import (CSV/JSON→ClimateSeries), validate_series, quality (Phase 3.9), units (3.8), sha256_json; in-memory/CSV/JSON sources; explicit variable/unit conversion/timestamp normalization (raw preserved, non-mutating); acceptance (ACCEPTED/ACCEPTED_WITH_WARNINGS/REJECTED/PENDING_REVIEW); to_climate_series model-ready boundary (rejected cannot enter); provenance (source/config/normalized/qc/result hashes); vertical integration with compute_et0_series | test_ingest | TESTED (scientific NOT validated) |
| R-3.11-01 | Generic workflow QC integration | Phase 3.11 | P1 | R-3.10-01 | 3.11 | WorkflowQCConfig (disabled=legacy); input QC after contract validation, output QC after output validation (reuse assess_climate_quality/QualityControlPolicy/qc_blocks_execution); QC_PASSED/WARNING/BLOCKED/UNAVAILABLE/NOT_EVALUATED; QC_BLOCKED input→FAILED→downstream SKIPPED (independent continue); on_unavailable warn/skip; provenance qc_config/qc_hash/qc_step_status + result_hash includes qc_hash; experiment artifact preserves qc + replay reconstructs; CRS-aware QC | test_workflow_qc | TESTED (scientific NOT validated) |
| R-3.12-01 | Workflow provenance & replay integrity | Phase 3.12 | P1 | R-3.11-01 | 3.12 | step-level provenance (input_hash/output_hash/dependencies/qc hashes/status); qc evidence hashes (per-step + workflow qc_hash) in result_hash; verify_experiment_integrity (structure + content-vs-hash + result-hash coherence); replay_experiment structured verification (MATCH/MISMATCH/NOT_VERIFIABLE/NOT_AVAILABLE; per-step output-hash comparison; discrepancies); original artifact not mutated; legacy without QC → MATCH when comparable | test_provenance_replay | TESTED (scientific NOT validated) |
| R-3.14-01 | Effective precipitation & preliminary crop water balance | Phase 3.14 | P1 | R-3.12-01 | 3.14 | effective_precip.py: compute_effective_precipitation (USDA-SCS Curve Number: S=25400/CN−254, Ia=0.2S, RO=(P−Ia)²/(P+0.8S), Pe=P−RO; CN explicit, never inferred) + compute_preliminary_water_balance (balance=Pe−ETc; surplus/deficit, not root-zone storage/irrigation/actual ET); validation, definitions, registered in runtime; software-only | test_effective_precip | TESTED (scientific NOT validated) |
| R-3.15-01 | Root-zone soil water balance (FAO-56 bucket) | Phase 3.15 | P1 | R-3.14-01 | 3.15 | root_zone.py: FAO-56 root-zone bucket; TAW=(θfc−θwp)·Zr, RAW=p·TAW; daily balance (P, RO, I, ETc; excess above FC; actualET limited to water above WP; unmet reported; Dr); conservation (S+P+I=RO+excess+actualET+S_final); units (mm, m3/m3; length-quantity conversion); initial-condition validation; sequential state propagation; registered in runtime; software-only | test_root_zone | TESTED (scientific NOT validated) |

**Terminology (kept distinct):** unit test ≠ parity ≠ mathematical verification ≠
calibration ≠ scientific validation ≠ operational validation. R-2.1-13/18 are
software verification only; **scientific validation is NOT performed** (model stays
`tested` / `NOT_VALIDATED`).

## F. Addendum — upstream component reuse (2026-11-20)

Targeted reuse of already-extracted upstream components into `engines/hydroma/`.
No project was re-extracted; no GPL code entered the core; no new infrastructure.

| ID | Requirement | Source | Priority | Depends on | Target | Acceptance | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| R-2.1-20 | Scientific spatial metadata contract (crs + domain + extent + resolution) | packages/scientific/spatial.ts | P1 | R-2.1-06 | 2.1 | domain kinds + validation match TS contract | test_spatial | TESTED |
| R-2.1-21 | Data-artifact reference contract (id/kind/uri/mediaType + optional checksum/spatial/temporal) | packages/scientific/data.ts | P1 | R-2.1-20 | 2.1 | validation matches TS contract; raster media types identified | test_data | TESTED |
| R-2.1-22 | Minimal STAC 1.0.0-compatible item/collection/catalog/asset (no PySTAC dependency) | PySTAC (Apache-2.0), adapted | P1 | R-2.1-21 | 2.1 | item/asset round-trip; extent/license; DataArtifact→Item mapping | test_stac | TESTED |
| R-2.1-23 | Optional tile-serving boundary (TiTiler-compatible, not imported/run) | TiTiler (MIT), reference only | P2 | R-2.1-22 | 2.1 | tile URL builder; provider validation; no TiTiler/rasterio import | test_tiling + test_boundaries | TESTED |
| R-2.1-24 | Architectural boundary enforcement (empty core deps; no apps/services; no GPL) | requirements map §A/§5 | P1 | R-2.1-01 | 2.1 | AST scan finds no forbidden imports; pyproject `dependencies = []` | test_boundaries | VERIFIED |

### Licence findings (see `upstream-registry/FINAL-LICENSE-AND-RISK-REGISTER.md`)

| Component | Licence | Decision |
|---|---|---|
| PySTAC | Apache-2.0 | B — adaptation (data model + media types reimplemented, no code copied) |
| TiTiler | MIT | C — reference only (URL contract shape; never imported) |
| HydroMT (core) | not extracted | C — reference only (concepts) |
| HydroMT-Wflow | **GPL-3.0** | D — reject for core (copyleft; needs owner approval + licence assessment) |

### Limitations (explicit)

* STAC subset targets **1.0.0** (PySTAC now defaults to 1.1.0); no STAC API/search,
  no extension modules, no JSON-Schema validation, no lazy resolution, no file I/O.
* Tiling is a **description** layer: producing a URL is not serving a tile; TiTiler
  is not a dependency and is not run.
* These are software-verified interfaces only; **scientific validation is NOT
  performed** and no maturity/scientific-status axis is promoted.

## G. Addendum — scientific data catalogue (2026-11-20)

Persistent, dependency-free catalogue making the STAC/DataArtifact capability
searchable. SQLite (stdlib), local-first, single-node. Stores metadata + asset
references only; never fetches assets. Independent of model execution.

| ID | Requirement | Source | Priority | Depends on | Target | Acceptance | Verification | Status |
|---|---|---|---|---|---|---|---|---|
| R-2.1-25 | Persistent STAC-subset Item/Collection store (SQLite, no new dep) | mission | P1 | R-2.1-22 | 2.1 | register/get; survives restart; `PRAGMA user_version` | test_catalogue (persistence, schema) | TESTED |
| R-2.1-26 | Duplicate-ID safety (no silent overwrite) | mission §4 | P0 | R-2.1-25 | 2.1 | duplicate → DuplicateItemError; explicit overwrite opt-in | test_catalogue::test_duplicate_id_rejected | TESTED |
| R-2.1-27 | Item/Collection validation + predictable errors | mission §4 | P0 | R-2.1-25 | 2.1 | invalid item/collection → ItemValidationError; DB error → CatalogueStoreError | test_catalogue (validation, readonly-db) | TESTED |
| R-2.1-28 | Filtering: collection / id / media-type / temporal / bbox-overlap | mission §5 | P1 | R-2.1-25 | 2.1 | each filter + boundary cases; deterministic order | test_catalogue (filtering, ordering, pagination) | TESTED |
| R-2.1-29 | DataArtifact → Item registration + searchability | mission §6 | P1 | R-2.1-22, R-2.1-25 | 2.1 | item_from_data_artifact output registers; asset/checksum/props preserved | test_catalogue::test_item_from_data_artifact_registers | TESTED |
| R-2.1-30 | Catalog serialization / retrieval | mission §3 | P2 | R-2.1-25 | 2.1 | to_catalog → STAC Catalog of item:// links; collections list/get | test_catalogue::test_to_catalog_serializes_links | TESTED |
| R-2.1-31 | Catalogue independent of model execution | mission §8 | P1 | R-2.1-01 | 2.1 | no model imports catalogue; catalogue imports no model | test_boundaries | VERIFIED |

### Catalogue limitations (explicit)

* STAC 1.0.0 subset only; **not full STAC compliance**; no STAC API/search endpoint.
* Bbox search is **bounding-box overlap only** (not precise geometry; not a GIS engine).
* Items with no temporal metadata are excluded when a temporal filter is applied.
* Assets are opaque references; no download/resolution/validation.
* Single-process/single-node; not a distributed catalogue.
* Software-verified only; **scientific validation is NOT performed**.
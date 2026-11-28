# engines/hydroma — scientific engine

**Status:** Phase 2.1 MVP — **implemented and tested** (1542 pytest tests, all passing; see
`docs/reports/AUTONOMOUS_FULL_PROJECT_ENGINEERING_REPORT.md`). Not scientifically validated.
Not production-ready distributed infrastructure.

**Authority:** root `README.md`, `ARCHITECTURE-DECISIONS-OPEN.md`,
`docs/architecture/PHASE-2.1-REQUIREMENTS-MAP.md`, and the TypeScript reference in
`packages/scientific/`.

This engine is the independent Python scientific runtime. It owns no business data,
exposes only an HTTP/CLI contract, and never imports from `apps/` or `services/`.

## Layout

```
engines/hydroma/
  hydroma/
    units.py          # explicit units, no silent conversion
    provenance.py     # SHA-256 provenance (schema_version, completeness)
    maturity.py       # software maturity + scientific status (two axes)
    water_balance.py  # faithful port of the TS root-zone water balance
    registry.py       # id@version registry + definition validation
    jobs.py           # SQLite job lifecycle (queued→running→completed|failed)
    runtime.py        # ties registry + store + provenance
    spatial.py        # scientific spatial metadata (port of packages/scientific spatial.ts)
    data.py           # DataArtifact references (port of packages/scientific data.ts)
    stac.py           # minimal STAC 1.0.0-compatible item/collection/catalog/asset
    tiling.py         # optional tile-serving boundary (TiTiler-compatible, no dependency)
    catalogue.py      # persistent SQLite STAC-subset catalogue (dependency-free)
    climate.py        # climate observation/series foundation (stdlib-only, source-independent)
    climate_import.py # climate CSV/JSON import & normalization (explicit config, no silent changes)
    climate_et0.py    # climate series -> FAO-56 ET0 integration (existing model, no formula change)
    soil_water_series.py # climate -> ET0 + precipitation -> daily soil-water workflow (existing models)
    crop_water_series.py # climate -> ET0 + precipitation -> crop-water stress -> daily soil-water (sequential)
    irrigation_series.py # + irrigation policy (none/schedule_to_target/explicit) on top of crop-water series
    scenario.py       # Scenario Engine: define/validate/execute/compare scenarios over existing integrations
    workflow.py       # Scientific Workflow Layer: DAG orchestration of models/integrations/scenarios
    contracts.py      # Scientific data contracts & runtime validation for workflow operations
    experiment.py     # Scientific experiments + reproducibility artifacts (hash/replay) over the workflow engine
    compare.py        # Experiment comparison & result inspection (descriptive, no scientific ranking)
    units.py          # Units: minimal UCUM helpers + dimensional system/registry/conversion/validation (Phase 3.8)
    quality.py        # Scientific data-quality & QC (flags/report/policies, strict+legacy unit enforcement)
    ingest.py         # Climate ingestion & quality-aware pipeline (source → ... → model-ready dataset)
    api.py            # FastAPI app (local-first)
    run_local.py      # loopback-by-default runner
  tests/              # pytest suite (units, water balance, provenance, maturity, jobs, api,
                      #   registry, spatial, data, stac, tiling, catalogue, climate, boundaries)
```

## Maturity model (two independent axes)

* **Software maturity:** `stub → implemented → tested → verified → validated →
  production_approved`. Advance one level at a time; passing a level requires the
  evidence for that level.
* **Scientific status:** `UNCALIBRATED / CALIBRATED / VALIDATED / NOT_VALIDATED`.
  **Passing unit tests never promotes this axis.** The Water Balance model is
  `tested` (software) and `NOT_VALIDATED` (scientific).

## Water Balance contract

Equation (depths in mm over the period):

```
deltaS = P + I + CR - ET - R - DP
```

* Inflows `P` (precipitation), `I` (irrigation), `CR` (capillary rise) are positive.
* Outflows `ET` (evapotranspiration), `R` (runoff), `DP` (deep percolation) are subtracted.
* `deltaS > 0` → root zone wetted up (surplus); `deltaS < 0` → dried down (deficit);
  `≈ 0` → balanced.

**Required inputs:** `periodDays` (day, finite integer > 0), `precipitation`, `irrigation`,
`runoff`, `evapotranspiration` (mm, ≥ 0).
**Optional inputs:** `deepPercolation`, `capillaryRise` (mm, default 0), `areaHa` (ha, > 0
when present, enables m³ conversion via `1 mm·ha = 10 m³`), `initialStorage` (mm, ≥ 0),
`measuredStorageChange` (mm, for closure residual).

**Validation rejects:** unsupported/incompatible units (`UNSUPPORTED_UNIT`), non-finite
values (`NOT_FINITE`), negatives (`NEGATIVE`), missing required (`MISSING`), invalid period
(`PERIOD_INVALID`), invalid area (`AREA_INVALID`), invalid storage (`STORAGE_INVALID`).
No scientifically invalid value is silently substituted.

**Outputs:** `storageChangeMm`, `storageChangeM3` (or null), `status`, `balanceCloses`
(or null), `finalStorageMm` (never negative; null when out of domain), `outOfDomain`,
`residualMm`, plus `warnings` (structured codes) and `equation`.
**Precision:** 4 decimals, half-up rounding. **Closure tolerance:** `max(1, 0.02·|inflow|)`.

## Units contract

`SUPPORTED_UNITS` covers length/time/area/volume/temperature with a canonical base per
dimension. `convert()` rejects unknown units, dimension mismatches, non-finite and
non-numeric values. No implicit conversion.

## Provenance contract

Every completed run carries a `ProvenanceRecord` with `schema_version` (1.0.0), model
identity, code version, input/result SHA-256 hashes, parameter hash, environment, timestamp,
operator, `validation_status` (maturity) and `scientific_status`. Canonicalization is
`sha256_json` (sorted keys, compact, UTF-8, `allow_nan=False`) — equal canonical inputs hash
equally, material differences hash differently. A hash proves integrity/reproducibility, not
scientific correctness. Failed runs store `error` and are distinguishable from completed runs.

**`parameter_hash` (Phase 2.6):** the SHA-256 of the run's *model parameter object*, computed
with `extract_model_parameters(definition, input_data)`. A model declares its parameters via an
optional top-level `parameters` list in its definition — the names of inputs that are intrinsic
model parameters (soil hydraulic `layers`, `rootZoneDepth`, depletion fraction `p`, crop
coefficient `kc`, `application_efficiency`, ...), as opposed to forcing/state/observation data.
Only declared names present in the input are hashed; missing optional parameters are omitted
(never invented or defaulted); undeclared input fields are ignored. Equivalent parameter objects
hash identically; any material parameter change hashes differently.

* Models that declare parameters: `soil-water-storage` (`layers`, `rootZoneDepth`, `p`),
  `daily-soil-water` (`layers`, `p`), `fao56-crop-water` (`kc`, `p`), `fao56-crop-water-chain`
  (`layers`, `rootZoneDepth`, `p`, `kc`), `irrigation-schedule` (`layers`, `p`, targets,
  `application_efficiency`).
* Models with **no** independent parameter object (e.g. `water-balance`, `fao56-et0`, whose
  inputs are all forcing/state/observations) declare no `parameters`; their parameter object is
  empty and `parameter_hash = sha256_json({})` (a real, deterministic hash — not a placeholder).
* `parameter_hash` is distinct from `input_hashes` (which covers the full input payload) and
  `result_hashes` (derived outputs); changing parameter hashing never alters those.

## Climate Data Foundation — `hydroma/climate.py`

A source-independent, stdlib-only contract for climate observations and time series, so
scientific models (FAO-56 ET0, daily soil-water, crop-water, irrigation) can consume climate
data through one deterministic contract — no weather API, network, database, GIS or HTTP.

**Observation** (`ClimateObservation`): `variable`, `value`, `unit`, `timestamp` (ISO-8601),
`basis` (temporal semantics), `quality` (flag), optional `source`. Extensible: not every
observation carries every variable.

**Supported variables / canonical units**

| Variable | Canonical unit | Bases |
|---|---|---|
| `air_temperature` | °C | instant, period_mean, daily_mean |
| `min_air_temperature` | °C | instant, daily_min |
| `max_air_temperature` | °C | instant, daily_max |
| `precipitation` | mm | period_sum, daily_sum |
| `relative_humidity` | % | instant, period_mean, daily_mean |
| `wind_speed` | m/s | instant, period_mean, daily_mean |
| `solar_radiation` | MJ/m²/day | period_sum, daily_sum |
| `evaporation` | mm | period_sum, daily_sum |

**Temporal semantics** (`TEMPORAL_BASES`): `instant`, `period_mean`, `period_sum`, `daily_mean`,
`daily_min`, `daily_max`, `daily_sum`. A daily value is never treated as an instant; the `basis`
disambiguates. Timestamps are ISO-8601; a `Z`/offset is converted to UTC, a value with no offset
is interpreted as UTC, and a date-only value is midnight UTC (stdlib only, no tz dependency).

**Units**: one canonical unit per variable; `is_unit_compatible(variable, unit)` validates
compatibility. No silent conversion (no general-purpose conversion framework).

**Quality flags** (`QUALITY_FLAGS`): `unchecked`, `valid`, `suspect`, `invalid`, `missing`.
Flags annotate, never modify, values. Absent quality = `unchecked` (a valid state).

**Missing data**: a *missing value* is an explicit record with `value=None` and `quality="missing"`
(never assumed to be zero — e.g. missing precipitation is not 0). A *missing observation* is an
absent timestamp, detected as a gap by `missing_periods(series)` when `temporal_resolution` is set.
Explicit `MISSING_DATA_POLICIES` (`error`, `skip`, `flag_only`) are defined for future integrations;
**no interpolation/imputation is performed** here.

**Series** (`ClimateSeries`): ordered observations + optional `variable`, `temporal_resolution`
(`1d`, `3h`, `30m`, `900s`), `spatial`, `provenance`, `missing_data_policy`. `validate_series`
reports (never repairs) out-of-order, duplicate (`DUPLICATE_OBSERVATION`), conflicting
(`CONFLICTING_OBSERVATION`), mixed-variable and missing-period (`MISSING_PERIODS`) issues.

**Spatial** (`SpatialContext`, optional): `latitude` (±90), `longitude` (±180), `elevation`,
`station_id`, `source_id`.

**Provenance** (`DataProvenance`, optional): `source_id`, `source_type`, `retrieved_at`,
`original_units`, `processing_history`, `qc_history`, `dataset_version`. Lightweight; compatible
with the engine provenance (does not replace Runtime provenance).

**Serialization**: `to_dict`/`from_dict` on all types; `canonical_series_json` and `series_hash`
(SHA-256 via the existing `sha256_json`) give deterministic output. No essential metadata is
dropped.

**Validation**: structured `{"valid", "errors", "warnings"}` from `validate_observation`,
`validate_series`, `validate_spatial`, `validate_provenance`. Errors vs warnings are distinguished.
No arbitrary scientific thresholds are applied.

**Limitations**: structural/quality-flag layer only — no meteorological QC algorithms, no
interpolation, no unit conversion, no provider ingestion, no forecasting. Software-tested; **not
scientifically validated**. Reference: `tests/test_climate.py`.

## Climate Dataset Import & Normalization — `hydroma/climate_import.py`

Transforms user-provided CSV / JSON climate files into the Climate Data Foundation contract
**without** silently changing, discarding, inventing or interpreting data. Stdlib-only
(`csv` + `json`); no network/DB/GIS/HTTP. Builds on `climate.py`; reuses its validation and
hashing.

**Configuration** (`ImportConfig`) — explicit, validated before parsing:
`format` (`csv`|`json`), `timestamp_column`, `variable_columns` (variable_id → column),
`input_units`, `conversions`, `basis` / `variable_basis`, `temporal_resolution`, `date_format`,
`timezone`, `missing_markers`, `quality_column` / `quality_mapping` / `quality_default`,
`on_unknown_quality`, `station_id`, `spatial`, `source`, `dataset_version`, `source_file`.

**CSV** — headers + explicit `variable_columns` + `timestamp_column`. One row may yield several
observations (multi-variable). Missing cells → explicit `quality="missing"` observations (never 0).
Malformed rows produce structured errors; short rows yield missing cells.

**JSON** — the existing climate serialization contract: a serialized `ClimateSeries`
(`{"observations": [...], ...}`) or a bare list of observation objects (same schema). No second
schema.

**Conversions** (`CONVERSIONS`, explicit only, never silent): `degF_to_degC`, `cm_to_mm`,
`kmh_to_ms`, `fraction_to_percent`. A conversion applies only when the input unit matches its
declared `from` unit and the variable is in scope. Solar radiation is **not** converted (no
unambiguous numeric conversion) — a mismatched unit is rejected. The original input unit and the
conversion are preserved in `ImportResult.metadata`.

**Timestamps**: ISO-8601 (date-only → daily; `Z`/offset → UTC), or an explicit `date_format`.
Ambiguous numeric dates (e.g. `03/04/2025`) are **rejected** unless `date_format` is configured.
Naive datetimes require an explicit `timezone` (`UTC` or a fixed offset like `+03:00`); otherwise
`INVALID_TIMESTAMP`. No tz-database dependency. No automatic aggregation/disaggregation.

**Quality**: optional quality column mapped explicitly (`quality_mapping`) to canonical flags;
already-canonical values pass through; unknown source codes → `UNKNOWN_QUALITY_CODE` (error, or
`warn` mode). No scientific thresholds.

**Import result** (`ImportResult`): `ok`, `partial`, `series`, `errors`, `warnings`,
`records_processed`, `records_accepted`, `records_rejected`, `missing_value_count`,
`missing_periods`, `metadata`, `validation`. `ok` is true only when there are no errors and the
resulting series is structurally valid; `partial` flags "some imported, errors remain". Equivalent
normalized datasets serialize/hash identically (`series_hash`).

**Limitations**: no automatic schema inference, no interpolation/imputation, no unit framework,
no provider ingestion. Software-tested; **not scientifically validated**. Reference:
`tests/test_climate_import.py`.

## Climate → FAO-56 ET0 Integration — `hydroma/climate_et0.py`

Runs the **existing** `compute_fao56_et0` model over a `ClimateSeries`, day by day, without
touching the FAO-56 mathematics. `compute_et0_series(series, config)` maps daily climate
observations to the ET0 input contract, validates daily completeness/quality, executes the
model, and returns an `ET0SeriesResult`.

**ET0 input contract** (from `fao56_et0.py`): required `rn` [MJ/m²/day], `t` [°C],
`u2` [m/s], `ea` [kPa]; optional `g` [MJ/m²/day, default 0], `z` [m, default 0].

**Climate mapping** (`ET0IntegrationConfig.variable_mapping`, explicit — no silent substitution):

| ET0 input | Climate source | Basis |
|---|---|---|
| `t` | `air_temperature` (or derived from `min`/`max` if `derive_mean_from_minmax`) | `daily_mean` |
| `u2` | `wind_speed` (assumed at 2 m; no height adjustment) | `daily_mean` |
| `ea` | derived from `relative_humidity` + `t` via `ea = RH/100 · es(T)` (FAO-56) | `daily_mean` |
| `rn` | **explicitly configured** climate variable (no default) | `daily_sum` |
| `z` | spatial elevation (m) or `elevation_m` override; else model default 0 (warned) | — |

**Critical integrity points**: incoming `solar_radiation` is **not** silently treated as net
radiation `rn`; if the user maps a variable to `rn`, the value is used as net radiation and an
`RN_TREATED_AS_NET_RADIATION` warning is emitted. `ea` is derived from RH (documented input
preparation, not a model change). Instantaneous/sub-daily observations are **rejected** for
daily ET0 (never reinterpreted). Dates are preserved as the observation's **local date** (no UTC
shift). Missing climate data is never treated as zero; missing days are reported, not filled.

**Quality policy**: `strict` (default) accepts `valid`/`unchecked` and rejects a day with
`suspect`/`invalid`/`missing`; `allow_suspect` accepts `suspect` with a warning. `invalid`/
`missing` always reject.

**Result** (`ET0SeriesResult`): `ok`, `partial`, `records` (date, `et0_mm_per_day`, inputs,
model id/version), `rejected`, `skipped`, `calculated_dates`, `missing_dates`, `errors`,
`warnings`, `metadata`, `provenance` (`climate_series_hash`, model id/version, mapping,
`results_hash`), `validation`. `ok` requires no errors, ≥1 record, no rejected days and no
missing dates; `partial` flags incomplete series.

**Provenance**: `climate_series_hash` (existing `series_hash`), model id/version, variable
mapping, elevation, and `results_hash` (SHA-256 of records) — no new hashing framework, no
runtime-provenance redesign.

**Limitations**: integration/traceability only — FAO-56 math is unchanged; **not scientifically
validated**. `rn` must be supplied explicitly (net radiation). Reference:
`tests/test_climate_et0.py`.

## Climate-Driven Soil Water Simulation — `hydroma/soil_water_series.py`

The first integrated workflow: `simulate_climate_soil_water(series, config)` connects a
`ClimateSeries` → precipitation + ET0 (via `climate_et0`) → the **existing**
`daily_soil_water` model, producing a deterministic, traceable daily soil-water series. It adds
**no** soil-water mathematics and does not modify ET0/soil-water calculations.

**Config** (`SoilWaterSeriesConfig`): `layers` (soil profile), `initial_storage_mm`, `p`,
`et0_config` (climate→ET0 config, incl. explicit `rn` mapping), `precipitation_variable`
(default `precipitation`), `quality_policy` (`strict`|`allow_suspect`), `irrigation_mm`
(default 0), `runoff_mm` (default 0), optional `start_date`/`end_date`/`max_days`.

**Precipitation**: explicit variable, unit (`mm`), basis (`daily_sum`/`period_sum`), quality,
value checks. Missing/invalid/suspect precipitation is **never** zero-filled or interpolated;
the day is rejected.

**ET0**: obtained from `compute_et0_series` (no independent ET0 math). ET0 is fed to the model
as `et_actual_mm` (actual ET = ET0, no water-stress/Ks reduction — documented simplification).

**Daily alignment**: precipitation and ET0 aligned by **local date** (no UTC shift, no
substitution). The ordered calendar range `[start, end]` is walked day by day.

**State continuity**: the daily model propagates storage across the `days` list it receives.
This integration builds the **contiguous valid prefix** and **stops at the first date that
cannot be computed** (missing/invalid precipitation or ET0, or a calendar gap). Days after the
boundary are reported as `skipped` (`continuity_interrupted`); the integration never invents a
state or resumes across an interruption.

**Result** (`SoilWaterSeriesResult`): `ok`, `partial`, `records[]` (date, precipitation, ET0,
initial/final storage, depletion, excess, TAW, RAW, status, warnings), `rejected[]`,
`skipped[]`, `calculated_dates[]`, `missing_dates[]`, `simulation_start/end`, `metadata`,
`provenance` (`climate_series_hash`, ET0 + soil model ids/versions, soil config, `results_hash`),
`validation`. `ok` requires no errors, no interruption and no missing dates; `partial` flags an
incomplete simulation. `to_dict()` is JSON-serializable.

**Provenance**: existing `series_hash` + `sha256_json`; no new hashing framework; runtime
provenance untouched.

**Limitations**: actual ET is approximated by ET0 (no water stress); irrigation/runoff default
to 0 when not supplied; simulation stops at the first interruption. Software integration only —
**not scientifically validated**. Reference: `tests/test_soil_water_series.py`.

## Climate-Driven Crop Water Simulation — `hydroma/crop_water_series.py`

A sequential daily crop-water workflow: `simulate_climate_crop_water(series, config)` connects a
`ClimateSeries` → precipitation + ET0 → the **existing** crop-water model
(`crop_water.compute_crop_water`) → the **existing** daily soil-water model
(`daily_soil_water.simulate_daily_soil_water`), with soil state evolving day by day. It adds **no**
crop-water or soil-water mathematics and changes no existing model.

**Config** (`CropWaterSeriesConfig`): `layers`, `initial_storage_mm`, `p`, `kc` (scalar or
per-day list), `et0_config` (climate→ET0 config, incl. explicit `rn`), `precipitation_variable`,
`quality_policy`, `irrigation_mm`/`runoff_mm` (default 0), optional `root_zone_depth_mm`,
`start_date`/`end_date`/`max_days`.

**Daily coupling (documented convention)**:
1. `Dr = S_FC − S` (start-of-day depletion, **pre-day** stress convention).
2. Crop water: `Ks`, `ETc_potential = Kc·ET0`, `ETc_adjusted = Ks·ETc_potential` from
   `compute_crop_water(et0, kc, p, TAW, Dr)`.
3. Soil water: `simulate_daily_soil_water` for that one day with `et_actual_mm = ETc_adjusted`.
4. Carry `final_storage` into the next day.

Stress is **not** recomputed from the post-ET state (no double counting). ET semantics:
`ET0 → ETc_potential → Ks → ETc_adjusted` (= modeled actual crop ET). The soil model's own
excess/below-zero accounting is preserved.

**Climate**: precipitation (explicit variable/unit/basis/quality; never zero-filled) + ET0 (via
`climate_et0`) aligned by **local date**. **Continuity**: stops at the first date that cannot be
computed (missing/invalid precip or ET0, or calendar gap); later days reported `skipped`. No
state invented.

**Result** (`CropWaterSeriesResult`): `ok`, `partial`, `records[]` (date, precipitation, ET0,
`kc`, `etc_potential`, `ks`, `etc_adjusted`, initial/final storage, depletion, excess, TAW, RAW,
status, warnings), `rejected[]`, `skipped[]`, `calculated_dates[]`, `missing_dates[]`,
`simulation_start/end`, `metadata`, `provenance` (climate series hash, ET0/crop/soil model
ids+versions, soil+crop config, `results_hash`), `validation`. `to_dict()` JSON-serializable.

**Provenance**: existing `series_hash` + `sha256_json`; runtime provenance untouched.

**Limitations**: `ETc_adjusted` is the modeled actual ET (single-Kc, no dual-source); irrigation/
runoff default 0; simulation stops at first interruption. Software integration only — **not
scientifically validated**. Reference: `tests/test_crop_water_series.py`.

## Climate-Driven Irrigation Simulation — `hydroma/irrigation_series.py`

Extends the crop-water workflow with an explicit irrigation-management policy, reusing the
**existing** irrigation model (`irrigation.compute_irrigation_schedule`). No existing model is
modified; no new irrigation/soil-water math is added.

**Config** (`IrrigationSeriesConfig`): soil `layers`, `initial_storage_mm`, `p`, `kc` (scalar or
per-day), `et0_config`, `irrigation_policy`, `application_efficiency?`, `target_depletion_mm?`,
`target_storage_mm?`, `max_irrigation_mm?`, `explicit_irrigation_mm`, `precipitation_variable`,
`quality_policy`, `runoff_mm`, `root_zone_depth_mm?`, `start_date`/`end_date`/`max_days`.

**Irrigation policy** (`irrigation_policy`):
- `none` (default, conservative): the irrigation model is still evaluated and its recommendation
  reported, but **no irrigation is applied** — a recommendation is never silently applied.
- `schedule_to_target`: if recommended, the **net** irrigation (capped by `max_irrigation_mm`) is
  applied to the root-zone bucket; gross (net/efficiency) is reported as the delivery requirement.
- `explicit`: a fixed `explicit_irrigation_mm` (net root-zone input, capped) is applied.

**Net vs gross**: the soil bucket receives **net** irrigation (water that infiltrates the root
zone). `gross_irrigation_mm = net / efficiency` is the delivery requirement; losses are **not**
added to the soil. Irrigation is applied exactly once per day. Recommendation vs application are
reported separately (`irrigation_recommended`, `net_irrigation_mm`, `gross_irrigation_mm`,
`irrigation_applied_mm`, `irrigation_gross_applied_mm`).

**Daily coupling**: start-of-day `Dr = S_FC − S` → crop water (`Ks`, `ETc_adjusted`) → irrigation
schedule (`Dr`, target, efficiency) → apply per policy → existing daily soil model with
`irrigation_mm = applied net`, `et_actual_mm = ETc_adjusted` → carry storage forward. Stress uses
pre-day depletion (irrigation added after); on irrigation days stress may be slightly overestimated
(documented). Water balance: `final = initial + precip + applied_net − runoff − excess − ETc_adj`.

**Result** (`IrrigationSeriesResult`): `ok`, `partial`, `records[]` (date, precip, ET0, kc,
`etc_potential`, `ks`, `etc_adjusted`, `irrigation_recommended`, `net_irrigation_mm`,
`gross_irrigation_mm`, `irrigation_applied_mm`, `irrigation_gross_applied_mm`,
`irrigation_policy`, initial/final storage, runoff, depletion, excess, TAW, RAW, status,
warnings), `rejected[]`, `skipped[]`, `calculated_dates[]`, `missing_dates[]`,
`simulation_start/end`, `metadata`, `provenance` (climate series hash + all model ids/versions +
soil/crop/irrigation config + `results_hash`), `validation`. `to_dict()` JSON-serializable.

**Limitations**: single-Kc; only net irrigation enters the soil (gross reported, losses not
simulated); irrigation/runoff default 0; simulation stops at first interruption. Software
integration only — **not scientifically validated**. Reference: `tests/test_irrigation_series.py`.

## Scenario Engine — `hydroma/scenario.py`

A bounded, deterministic layer to define, validate, execute and compare multiple **scenarios**
using the existing climate-driven irrigation simulation (`simulate_climate_irrigation`). It adds
**no** scientific model and changes no existing integration.

**Scenario** (`ScenarioConfig`): identity (`scenario_id`, `name`, `description`, `baseline`) +
an explicit irrigation-series configuration (`layers`, `initial_storage_mm`, `p`, `kc`,
`irrigation_policy`, `application_efficiency`, targets, caps, `root_zone_depth_mm`,
`quality_policy`, `runoff_mm`, `metadata`). Every field maps to a real integration parameter.

**Execution** (`run_scenarios(series, scenarios, et0_config=None, start_date=None, end_date=None)`):
validates scenarios (unique ids, **exactly one explicit baseline**, valid integration config),
then executes each scenario **independently** over common forcing (sequential). Each scenario
starts from its **own** initial state — no cross-scenario contamination. A failed scenario never
alters others. Returns `ScenarioSetResult` (`ok`, `baseline_id`, `results[]`, `comparison`,
`errors`, `warnings`, `metadata`, `provenance`).

**Per-scenario result** (`ScenarioResult`): full `IrrigationSeriesResult` fields + `scenario_id`,
`baseline`, `config_hash`, `conditions`. `to_dict()` JSON-serializable.

**Comparison** (`compare_scenarios`, surfaced in `ScenarioSetResult.comparison`): documented
metrics per scenario (`final_storage_mm`, `mean_storage_mm`, `min_storage_mm`,
`total_precipitation_mm`, `total_et0_mm`, `total_etc_adjusted_mm`, `total_net_irrigation_mm`,
`total_gross_irrigation_mm`, `total_runoff_mm`, `total_excess_mm`, `days_with_stress`, `mean_ks`,
`min_ks`, `duration_days`, `status`), plus **differences vs baseline** (absolute + relative,
relative only when baseline ≠ 0). `compatible` is true only when all scenarios complete and share
the same simulation period **and** soil/initial conditions; otherwise warnings
(`soil_or_initial_conditions_differ`, `incomplete_scenarios:...`, `simulation_period_differs`)
flag the incompatibility. Comparisons are descriptive, not causal.

**Provenance**: `climate_series_hash`, per-scenario `scenario_config_hash` (deterministic SHA-256
of the scientific config), per-scenario `results_hash`, model ids/versions, engine id/version.
Existing `sha256_json`/`series_hash`; no new hashing framework.

**Limitations**: descriptive comparison only (no optimization/Monte-Carlo/ML/yield/economics);
`ETc_adjusted` is modeled crop ET, not measured; comparisons valid only under common forcing/
period/conditions; incomplete scenarios are marked partial. Software maturity `tested`,
**scientific maturity `NOT_VALIDATED`**. Reference: `tests/test_scenario.py`.

## Scientific Workflow Layer — `hydroma/workflow.py`

A bounded, deterministic orchestration layer that runs existing HyDroMA models and
integrations through explicit, validated workflow definitions. It adds **no** scientific
calculation and changes no existing model/integration.

**Definition** (`WorkflowDefinition`): `workflow_id`, `workflow_version`, `inputs`
(`WorkflowInput` name/required), `steps` (`WorkflowStep` = `step_id`, `step_type`,
`operation`, `dependencies`, `inputs` literals, `input_refs`, `description`).

**Step types** (bounded, safe — no `eval`/`exec`/dynamic import):
- `model` — execute a registered model via the existing `ModelRegistry` (`operation` =
  `model_id` or `model_id@version`).
- `integration` — `compute_et0_series`, `simulate_climate_soil_water`,
  `simulate_climate_crop_water`, `simulate_climate_irrigation`.
- `scenario` — `run_scenarios` (Scenario Engine).

**Input resolution**: a step's inputs come from workflow inputs (`workflow.<name>`), upstream
step outputs (`<step_id>.<path...>`), and literal config. References are validated (upstream
only, no ambiguity). Each step receives only its declared inputs — no implicit inheritance.

**Dependency graph**: explicit `dependencies`; validation detects duplicate step ids, missing
dependencies, self/duplicate deps, unsupported operations, and **cycles** (DFS). Deterministic
stable topological order (declaration order tie-break). Sequential execution only.

**Execution** (`run_workflow(definition, inputs, registry=None)`): validates, then runs steps in
topological order. Each step runs only after dependencies succeed. A step fails if the operation
raises **or** returns `ok=False` (result preserved); downstream steps are **SKIPPED** (no silent
recovery). Independent steps still run. Workflow status: `COMPLETED` / `FAILED` / `PARTIAL`;
step status: `PENDING`/`RUNNING`/`COMPLETED`/`FAILED`/`SKIPPED`.

**Result** (`WorkflowResult`): `workflow_id`, `workflow_version`, `status`, `partial`, `order`,
`steps` (`StepResult` with `output`/`error`/status/timestamps), `errors`, `warnings`,
`metadata`, `provenance`. `to_dict()` JSON-serializable.

**Provenance**: `workflow_hash` (SHA-256 of the definition), `input_hash`, per-step
`step_provenance` (operation/type/status/`output_hash`), `result_hash` (deterministic, excludes
wall-clock timestamps). Existing `sha256_json`; no new framework.

**Example**: `example_climate_irrigation_workflow()` — an end-to-end workflow (ET0 diagnostic
step → scenario comparison step) reusing existing integrations without duplicating calculations.

**Limitations**: no parallel/distributed execution, scheduling, persistence, retries, or API;
descriptive orchestration only. Software maturity `tested`, **scientific maturity
`NOT_VALIDATED`**. Reference: `tests/test_workflow.py`.

### Workflow QC integration (Phase 3.11)

`WorkflowDefinition.qc: Optional[WorkflowQCConfig]` (disabled by default → legacy behavior
unchanged). When `enabled`, each step runs **input QC** after input contract validation and
**output QC** after output contract validation, reusing `quality.assess_climate_quality` /
`QualityControlPolicy` / `qc_blocks_execution` (no new QC engine). QC applies to any
`ClimateSeries` found in the step inputs/output; otherwise `QC_UNAVAILABLE` (never treated as
pass).

- **Statuses**: `QC_PASSED`, `QC_WARNING`, `QC_BLOCKED`, `QC_UNAVAILABLE`, `QC_NOT_EVALUATED`
  (recorded per step in `StepResult.input_qc`/`output_qc`).
- **Blocking**: `QC_BLOCKED` input → step `FAILED` (`QC_BLOCKED_INPUT`) → dependent steps
  `SKIPPED`; independent steps continue. `QC_BLOCKED` output → step `FAILED` (`QC_BLOCKED_OUTPUT`).
  Blocking is governed by `QualityControlPolicy.error_blocks_execution` (default true) and
  `warn_blocks_execution` (default false). `on_unavailable="warn"` (default) records
  `QC_UNAVAILABLE` and continues; `"skip"` marks the step `SKIPPED`.
- **Provenance**: `qc_config`, `qc_config_hash`, `qc_step_status`, `qc_hash`; `result_hash`
  includes `qc_hash` (QC findings affect the deterministic result hash). Experiment artifacts
  preserve `qc` and replay reconstructs it (`_workflow_from_dict`).
- **CRS safety**: QC reuses the CRS-aware spatial checks (projected/unknown/absent CRS are not
  lat/lon-checked).
- **Limitations**: QC is climate-domain only (`QC_UNAVAILABLE` elsewhere); no QC algorithms added.
Software maturity `tested`, **scientific maturity `NOT_VALIDATED`**. Reference:
`tests/test_workflow_qc.py`.

## Scientific Data Contracts & Validation — `hydroma/contracts.py`

A lightweight, dependency-free contract layer that describes the **shape** of data
passed between workflow operations and validates it at runtime. It separates
**structural** validation (required fields, types, nested shape, units) from
**data** validation (finite numbers, numeric constraints), and is explicitly **not**
scientific validation.

**Contract model**: `FieldSpec` (name, type `any|object|array|string|number|boolean`,
required, unit, `min`/`max`, `finite`, `expected_class`, nested `fields`, `item_type`,
`item_fields`) → `DataContract` (contract_id, version, direction, category, fields).
`validate_contract(contract, data)` accepts a mapping (workflow kwargs) or an
object/dataclass (integration result) and returns a structured `ValidationResult`
(`valid`, `category`, `contract_id`, `contract_version`, `errors[]`, `warnings[]`;
errors carry `code`/`path`/`message`). Deterministic and JSON-serializable.

**Contract registry** (`CONTRACTS`, `get_contract(operation, direction)`): input/output
contracts for `compute_et0_series`, `simulate_climate_soil_water`,
`simulate_climate_crop_water`, `simulate_climate_irrigation`, `run_scenarios`. Input
contracts check `series` (ClimateSeries) + typed `config`; output contracts check
`ok` + the main collection (`records` / `results` / `comparison`).

**Workflow integration**: before executing a step, its inputs are validated against
the operation's input contract; after execution, outputs are validated against the
output contract. Contract-invalid inputs **prevent execution**; contract-invalid
outputs **prevent downstream consumption**. Both mark the step `FAILED`
(`CONTRACT_INPUT_INVALID` / `CONTRACT_OUTPUT_INVALID`) and cause dependent steps to be
`SKIPPED`; independent steps still run. Validation outcomes are recorded per step
(`input_validation`/`output_validation`) and in provenance (`step_provenance`), and are
part of the deterministic `result_hash`.

**Contractless operations**: model steps and any operation without a declared contract
are executed without contract validation (`CONTRACTLESS_POLICY`) — no contract is
invented. This is explicit and documented.

**Limitations**: structural/data contracts only — no scientific validation, no JSON-Schema,
no extension/plugin system. Software maturity `tested`, **scientific maturity
`NOT_VALIDATED`**. Reference: `tests/test_contracts.py`.

## Scientific Experiment & Reproducibility Artifacts — `hydroma/experiment.py`

Defines scientific experiments, executes them through the **existing Workflow Engine**, and
emits structured, serializable **reproducibility artifacts**. Adds no scientific calculation and
bypasses no boundary.

**Definition** (`ExperimentDefinition`): `experiment_id`, `name`, `experiment_version`,
`description`, `workflow` (a `WorkflowDefinition`), `tags`, `metadata`. Inputs are supplied at
execution and captured in the artifact.

**Execution** (`run_experiment(definition, inputs, registry=None)`): validates the definition
(identity + embedded workflow via `validate_workflow`), checks required workflow inputs, runs
`run_workflow` (preserving contract validation), and returns `ExperimentResult` (`status`
`COMPLETED`/`FAILED`/`PARTIAL`/`INVALID_DEFINITION`, `ok`, `partial`, `workflow_result`,
`artifact`, `errors`, `warnings`).

**Artifact** (`artifact_schema_version` = `1.0.0`): identity (`experiment_id`, `experiment_version`,
`run_id`, `created_at`), scientific configuration (`definition`, `inputs`, `config_hash`),
execution context (`execution.workflow_status`, per-step status), provenance (workflow
provenance + `result_hash`), and validation (`scientific_status = NOT_VALIDATED`, per-step
input/output contract validation). `validate_artifact(artifact)` checks structure + schema version.

**Hashing / determinism** (five distinct hashes):
- `definition_hash` — SHA-256 of the experiment definition.
- `workflow_hash` — SHA-256 of the workflow definition.
- `input_hash` — SHA-256 of the JSON-safe inputs.
- `config_hash` — SHA-256 of the scientific config (workflow + tags + metadata).
- `result_hash` — SHA-256 of the deterministic workflow step results.
- `artifact_hash` — SHA-256 of the artifact content (excludes volatile `run_id`/`created_at`).

Volatile fields are excluded from deterministic hashes; equivalent definitions + inputs →
identical `artifact_hash`. Terminology kept distinct: computational determinism ≠ computational
reproducibility ≠ scientific reproducibility ≠ scientific validation.

**Replay** (`replay_experiment(artifact, inputs=None, registry=None)`): reconstructs the
experiment definition from the artifact and re-executes via the Workflow Engine, comparing
`result_hash`. Requires the caller to supply the **original inputs** (the artifact records their
hash, not executable objects); if inputs are absent and not recorded as usable data, returns
`UNAVAILABLE` (no silent substitution). Returns `match` (identical / different / incomplete).

**Security**: no `eval`/`exec`/dynamic import; safe serialization only; no secrets or arbitrary
objects serialized.

**Limitations**: no persistence/DB/cloud/scheduling/parallel/API/UI; replay needs original inputs;
scientific validation not performed. Software maturity `tested`, **scientific maturity
`NOT_VALIDATED`**. Reference: `tests/test_experiment.py`.

### Provenance & replay integrity (Phase 3.12)

- **Step-level provenance** (`provenance.step_provenance[sid]`): `step_id`, `operation`,
  `step_type`, `status`, `dependencies`, `input_hash`, `input_validation`, `output_validation`,
  `input_qc`/`output_qc` status, `input_qc_hash`/`output_qc_hash` (QC report hashes), `output_hash`.
  Traceable back to the data/config each step used; skipped/failed/blocked steps are not
  represented as successful.
- **QC evidence integrity**: workflow `provenance.qc_config`, `qc_config_hash`, `qc_step_status`
  (per-step input/output QC status + report hashes), `qc_hash`; `result_hash` includes `qc_hash`.
  QC is climate-domain only (`QC_UNAVAILABLE` elsewhere); disabled QC is recorded as absent
  (never claimed as performed).
- **Experiment integrity**: `verify_experiment_integrity(artifact)` = structure + content-vs-hash
  (`artifact_hash`, `input_hash`) + `result_hash` coherence (top-level == workflow provenance).
- **Replay verification** (`replay_experiment`): reconstructs the definition, re-executes, and
  **compares** original vs replay evidence — `workflow`, `config`, `input`, `result`, `qc`, and
  per-step output hashes. Returns `verification_status` ∈ `MATCH` / `MISMATCH` / `NOT_VERIFIABLE`
  / `NOT_AVAILABLE` with per-check results and `discrepancies`. Missing evidence is
  `NOT_VERIFIABLE` (never counted as match); legacy artifacts without QC remain `MATCH` when all
  comparable checks agree. The original artifact is never mutated by replay.
- **Canonical hashing**: `sha256_json` (sorted keys, compact, UTF-8) — mapping-order independent,
  sensitive to material changes; volatile timestamps excluded from content hashes.
- **Limitations**: replay requires original inputs; **not** scientific validation.
Software maturity `tested`, **scientific maturity `NOT_VALIDATED`**. Reference:
`tests/test_provenance_replay.py`.

## Experiment Comparison & Result Inspection — `hydroma/compare.py`

A bounded, **descriptive** comparison layer for Phase 3.6 experiment artifacts and results. It
reports structural differences only — never that one experiment is scientifically better, more
accurate, or causally responsible.

**API**:
- `compare_experiments(a, b)` — compare two artifacts (dicts) or two `ExperimentResult`s.
- `compare_experiment_results(res_a, res_b)` — compare two `ExperimentResult`s (enables result
  path/value inspection because results carry step outputs).
- `flatten_result(obj)` — flatten a nested result to dotted paths.

**Result** (`comparison_schema_version` 1.0.0): `status` (`COMPARABLE`/`INCOMPATIBLE`/`INVALID`),
`identity`, `integrity`, `compatibility`, `execution`, `result`, `provenance`, `warnings`,
`limitations`.

**Compatibility** (independent per dimension, statuses `IDENTICAL`/`DIFFERENT`/`INCOMPATIBLE`/
`UNKNOWN`/`NOT_AVAILABLE`): `definition` (definition_hash), `workflow` (workflow_hash), `input`
(input_hash), `configuration` (config_hash), `engine` (layer id/version), `contract` (contract
versions from validation). Dimensions are **not** collapsed into one boolean.

**Execution comparison**: workflow status, partial state, per-step status changes (failed/skipped
preserved, never reinterpreted as success).

**Result comparison**: for artifacts → hash-level (`result_hash` match). For `ExperimentResult`
→ path-level: added/removed paths, matching, identical, changed (raw numeric `difference` only
when both finite numbers), `type_changed`, `non_finite` (never numerically compared). No unit
conversion, no tolerance, no cross-field unit assumptions.

**Provenance comparison**: workflow/input/config/result/definition hash statuses; distinguishes a
provenance difference from a result difference.

**Integrity** (`verify_artifact_integrity`, Phase 3.6 clarification):
- Artifacts contain the **JSON-safe input representation** (`inputs`) **and** its `input_hash`.
- Replay can use recorded inputs only when they are plain JSON data; otherwise the caller must
  supply the original inputs (opaque objects are not executable).
- `artifact_hash` covers all artifact content **except** volatile `run_id`/`created_at`/
  `artifact_hash`.
- `validate_artifact` checks structure + schema version only; `verify_artifact_integrity`
  recomputes `artifact_hash` and `input_hash` to detect content/hash inconsistency (not
  tamper-proof — only valid if the expected hash is trusted).

**Example**:
```python
from hydroma.compare import compare_experiments
c = compare_experiments(run_a.artifact, run_b.artifact)
print(c["status"], c["compatibility"], c["result"]["hash_match"])
```

**Limitations**: descriptive only — no optimization/sensitivity/statistics/causal inference/
ranking/calibration/validation; artifacts don't store outputs (hash-level result comparison
unless `ExperimentResult` is passed). Software maturity `tested`, **scientific maturity
`NOT_VALIDATED`**. Reference: `tests/test_compare.py`.

## Scientific Units & Dimensional Consistency — `hydroma/units.py`

A lightweight, dependency-free dimensional layer that prevents physically incompatible
quantities from silently entering models/operations. It **coexists** with the original minimal
unit helpers (unchanged, backward-compatible) and adds an explicit dimensional system.

**Dimensions**: `BaseDimension` = exponent vector over (length L, mass M, time T, temperature Θ).
Derived dimensions: area L², volume L³, velocity L T⁻¹, flow L³ T⁻¹, pressure M L⁻¹ T⁻², energy
M L² T⁻², power M L² T⁻³, energy flux/area M T⁻³, dimensionless 1.

**Registry** (`UNIT_DEFINITIONS`, 33 units): length (`m/cm/mm/km`), area (`m2/ha/km2`), volume
(`m3/L`), time (`s/min/h/day`), velocity (`m/s/km/h`), flow (`m3/s/m3/day`), mass (`kg/g`),
temperature (`K/degC/degF` absolute + `delta_degC/delta_K` differences), pressure (`Pa/kPa`),
dimensionless (`1/%`), energy (`J/MJ`), energy flux (`MJ/m2/day`), water depth per time
(`mm/day`, `mm/hour`). Each unit: symbol, dimension, factor (+ offset for affine).

**API**: `get_unit`, `list_units`, `is_known_unit`, `are_compatible(a, b)`,
`convert_value(value, from, to)` (absolute; affine offset), `convert_difference(value, from, to)`
(temperature differences, no offset), `validate_unit(actual, expected)` → `UNIT_EXACT_MATCH`/
`UNIT_COMPATIBLE`/`UNIT_INCOMPATIBLE`/`UNIT_UNKNOWN`.

**Temperature semantics**: absolute (`K`, `degC`, `degF`) are affine (offset); differences
(`delta_degC`, `delta_K`) are not. `convert_value` refuses absolute↔difference conversions
(`UnitError`); `convert_difference` handles differences. `degC` is never treated as a
multiplicative unit.

**Contract integration**: `FieldSpec.unit` is now validated at runtime when the value carries
unit metadata (a `{"value", "unit"}` quantity). `validate_contract` records a `units` list
(`path`, `status`, `actual_unit`, `expected_unit`); `UNIT_UNKNOWN`/`UNIT_INCOMPATIBLE` are errors
(`UNIT_UNKNOWN`/`UNIT_INCOMPATIBLE`), `UNIT_MISSING` (plain number without unit metadata) is a
documented gap, not a failure. Fields **without** `unit` metadata are unaffected (backward
compatible). No implicit conversion during validation.

**Workflow integration**: unit checks run through existing contract validation; unit errors mark
the step `FAILED` (`CONTRACT_INPUT_INVALID`), dependent steps `SKIPPED`, independent steps
continue; results appear in step `input_validation.units` and provenance.

**Explicit conversion** is opt-in only (`convert_value`/`convert_difference`); models do not
auto-convert. **Adding a unit**: append a `UnitDefinition` to `UNIT_DEFINITIONS` with a correct
dimension + factor (and offset/affine for temperature), then add a test.

**Limitations**: unit consistency improves interface integrity but does **not** establish
scientific validity of a model or dataset. No automatic inference/conversion, no uncertainty
propagation, no calibration. Software maturity `tested`, **scientific maturity `NOT_VALIDATED`**.
Reference: `tests/test_units_dimension.py`.

## Scientific Data Quality & Quality Control — `hydroma/quality.py`

A bounded, dependency-free QC layer that inspects climate observations and series **before**
they enter scientific computations. It **detects and reports** quality issues and never modifies
original values (no imputation, smoothing, correction, or timestamp repair).

**Structures**: `QualityFlag` (code, severity `INFO`/`WARNING`/`ERROR`, message, field_path,
observation_id, rule_id, metadata); `QualityReport` (schema version, identity, status
`PASS`/`PASS_WITH_WARNINGS`/`REJECTED`/`NOT_EVALUATED`, record/evaluated counts, counts by
severity and by state `GOOD`/`SUSPECT`/`BAD`/`MISSING`, flags, rules applied, unit policy,
policy, limitations). `QualityReport.canonical_hash()` is deterministic (no timestamps).

**Checks** (rule IDs stable): structural (missing value, non-finite, unknown variable,
duplicate/non-monotonic timestamps, missing periods, invalid structure), unit-aware (unit
missing/unknown/incompatible — reusing Phase 3.8), climate physical (`precipitation`/`wind_speed`/
`solar_radiation` negative → ERROR; `relative_humidity` outside [0,100] → ERROR), configurable
plausibility thresholds (WARNING, only when explicitly configured — no arbitrary defaults), and
spatial (latitude ±90, longitude ±180 → ERROR).

**Unit policies (Phase 3.8 limitation resolved)**: `LEGACY` (default) records a plain number
without unit metadata as `UNIT_MISSING` (documented gap, no failure); `STRICT` treats it as a
`UNIT_MISSING` **error**. In both, unknown/incompatible units are errors. Policy is set at the
`DataContract` boundary (`validate_contract(contract, data, unit_policy=...)`) and at the
workflow level (`WorkflowDefinition.unit_policy`), recorded in `ValidationResult.unit_policy`,
step `input_validation`, and experiment artifacts (preserved on replay). Existing workflows stay
`LEGACY`; new scientific workflows opt into `STRICT`.

**Workflow integration**: QC is exposed as the `assess_climate_quality` operation (input:
`series`; output: `ok`/`status`/flags). A `REJECTED` report → `ok=False` → step `FAILED` →
dependent steps `SKIPPED`; independent steps continue. `qc_blocks_execution(report, policy)`
controls blocking via `error_blocks_execution`/`warn_blocks_execution`.

**Data preservation**: the QC layer only reads observations; `test_qc_preserves_original_inputs`
verifies inputs are unchanged.

**Limitations**: data-quality assessment only — not scientific model validation, calibration, or
uncertainty analysis; no imputation/correction; no universal thresholds. Software maturity
`tested`, **scientific maturity `NOT_VALIDATED`**. Reference: `tests/test_quality.py`.

## Climate Data Ingestion & Quality-Aware Pipeline — `hydroma/ingest.py`

A small, modular pipeline: `SOURCE → INGEST → NORMALIZE → VALIDATE → QC → ACCEPTANCE →
MODEL-READY`. It **reuses** existing components (no duplicate import/QC/hashing):

* ingest + normalize: `climate_import` (CSV/JSON → `ClimateSeries`);
* structural validation: `climate.validate_series`;
* QC: `quality.assess_climate_quality` (Phase 3.9), incl. LEGACY/STRICT unit policy;
* hashing: `provenance.sha256_json` / `climate.series_hash`.

**Sources**: CSV text, JSON text, or an existing in-memory `ClimateSeries` (`format="csv"|"json"|"memory"`).

**Pipeline stages**:
1. **Ingest** — `climate_import` parses CSV/JSON with an explicit `ImportConfig` (delimiter is comma via `csv`; timestamp column, variable mapping, input units, conversions, basis, resolution, missing markers). Raw source is never mutated; `raw` records source name/format/content hash.
2. **Normalize** — explicit variable mapping + unit conversion (reuses Phase 3.8 `cm_to_mm`, `degF_to_degC`, …) + timestamp parsing (ISO or explicit `date_format`; naive requires `timezone`).
3. **Validate** — `validate_series` (structural). In `LEGACY`, unit-compatibility errors are non-blocking (QC handles); in `STRICT` they block.
4. **QC** — `assess_climate_quality` with `QualityControlPolicy(unit_policy=...)`; climate only (`domain="climate"`). Non-climate domains → `QC_NOT_AVAILABLE` → `PENDING_REVIEW`.
5. **Acceptance** (distinct from QC; approved precedence, deterministic): `CONTRACT_INVALID` → REJECTED; `STRICT_UNIT_MISSING` → REJECTED; blocking QC error (`error_blocks_execution`) → REJECTED / `QC_ERROR`; non-climate domain → PENDING_REVIEW / `QC_UNAVAILABLE`; no records → PENDING_REVIEW / `REVIEW_REQUIRED`; non-blocking QC errors → ACCEPTED_WITH_WARNINGS / `QC_ERRORS_NONBLOCKING`; blocking QC warning (`warn_blocks_execution`) → REJECTED / `QC_WARNING_BLOCKING`; other warnings → ACCEPTED_WITH_WARNINGS / `QC_WARNINGS`; else ACCEPTED / `PASSED`. `QualityControlPolicy.error_blocks_execution`/`warn_blocks_execution` are consulted here.

**Model-ready boundary**: `to_climate_series(result)` returns the `ClimateSeries` only if `result.ok` (accepted), else raises `IngestionError`. Rejected datasets cannot enter models.

**Dataset** (`ScientificDataset`): id/version/domain/source/series/variables/temporal/spatial/units/provenance/validation/quality/acceptance.

**Provenance**: source content hash, `config_hash` (import + unit + QC config), `normalized_dataset_hash` (series hash), `qc_hash`, `acceptance`, `result_hash`. Deterministic (no timestamps in hashes).

**Example**:
```python
from hydroma.climate_import import ImportConfig
from hydroma.ingest import ClimateIngestionConfig, ingest_climate, to_climate_series
cfg = ClimateIngestionConfig(format="csv", source_name="meteo.csv", unit_policy="STRICT",
    import_config=ImportConfig(format="csv", timestamp_column="date",
        variable_columns={"air_temperature": "tmean", "precipitation": "precip"},
        input_units={"air_temperature": "degC", "precipitation": "mm"},
        basis="daily_mean", variable_basis={"precipitation": "daily_sum"},
        temporal_resolution="1d"))
res = ingest_climate(csv_text, cfg)
series = to_climate_series(res)   # raises IngestionError if not accepted
```

**Limitations**: climate domain only (others → `PENDING_REVIEW`); no network/provider ingestion; no imputation/correction; no DB/persistence. Software maturity `tested`, **scientific maturity `NOT_VALIDATED`**. Reference: `tests/test_ingest.py`.

## Job lifecycle

`queued → running → completed | failed`. Atomic claim (one worker wins), heartbeat,
completion/failure with provenance/error, stale-run recovery via an explicit timeout policy.
Jobs persist in SQLite and survive restarts. A minimal `PRAGMA user_version` schema version
is tracked.

**SQLite limits:** single-process/single-node durable store, **not** a distributed queue.
Not production-grade concurrent/distributed job infrastructure.

## API contract (local-first)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/v1/models` | registry metadata (id, version, maturity, scientific_status, units, I/O) |
| POST | `/v1/runs` | create a run (202) → executes via background worker |
| GET | `/v1/runs/{id}` | run status/result/provenance/error |
| GET | `/v1/runs/{id}/provenance` | provenance (409 if not yet available) |

Malformed input → 422; unknown model/run → 404.

## Local security boundary

The default binding is **loopback (127.0.0.1)**; `run_local.py` refuses a non-loopback host
unless `--allow-external` is passed explicitly. **Authentication and multi-tenancy are not
implemented**; `tenant_id` is recorded, not authorised. See the requirements map for deferred
security requirements.

## How to run

```powershell
# tests
py -m venv .venv
. .venv\Scripts\pip install fastapi "uvicorn[standard]" pydantic pytest httpx
..venv\Scripts\python -m pytest

# local API (loopback only)
..venv\Scripts\python -m hydroma.run_local --host 127.0.0.1 --port 8000
```

## Upstream reuse (Phase 2.1 extension)

The engine reuses upstream components only where they add scientific or
interoperability value without importing a heavy framework into the core
runtime. See `upstream-registry/FINAL-LICENSE-AND-RISK-REGISTER.md` for the full
licence review; the summary relevant to the engine:

| Component | Licence | Decision | What was reused |
|---|---|---|---|
| PySTAC (`upstream-registry/pystac`) | Apache-2.0 | **B — adaptation** | Data model + media-type vocabulary, reimplemented as a dependency-free minimal STAC 1.0.0 subset (`stac.py`). Not a re-extraction. |
| TiTiler (`upstream-registry/titiler`) | MIT | **C — reference only** | Tile-URL contract shape only (`tiling.py`). TiTiler is never imported, installed or run. |
| HydroMT | (core not extracted) | **C — reference only** | Data-catalog / model-schematisation concepts; no code transferred. |
| HydroMT-Wflow (`upstream-registry/hydromt-wflow`) | **GPL-3.0** | **D — reject for core** | Strong copyleft. Not integrated into the core; would require explicit owner approval + licence assessment before any optional model integration. |
| `packages/scientific` (spatial.ts / data.ts) | project | **B — adaptation** | Behavioural contract ported to `spatial.py` / `data.py` (same domain kinds + validation rules). |

**Boundaries enforced by `tests/test_boundaries.py`:** the scientific runtime
imports no third-party package (empty dependency set); `stac.py`/`tiling.py` do
not import PySTAC, TiTiler, rio-tiler or rasterio; the engine never imports
`apps/` or `services/`.

**Non-negotiable scientific contract (per domain, before acceptance)**

Every model must publish: inputs (units, resolution), outputs (units), data sources
(provider/licence/version), model identity (name/version/calibration/code origin),
provenance, uncertainty method, and validation protocol. Passing tests are not validation.

## Verification & interoperability (Phase 2.1 continuation)

* **Cross-language parity:** `tests/vectors/water_balance_vectors.json` holds shared,
  independently-derived vectors (plain-number inputs). `tests/parity_ts.mjs` runs the
  **actual TypeScript** `computeWaterBalance` (Node 26 native type-stripping) over the same
  vectors; `tests/test_parity.py` compares TS vs Python vs expected. Parity ≠ validation.
* **Physical constraints (documented boundary rules):** the balance equation
  `ΔS = inflow − outflow` always holds (water is never silently discarded). A negative final
  storage is **not clamped to 0**: `finalStorageMm` is returned as `null` and the result is
  flagged `outOfDomain` with a `NEGATIVE_STORAGE` warning. Residual = computed − observed;
  closure uses tolerance `max(1, 0.02·|inflow|)`. These are explicit model-boundary rules,
  not validated physics.
* **Job concurrency:** atomic single-row `UPDATE … WHERE status='queued'` plus a SQLite
  `busy_timeout` (connect `timeout=10`). Thread concurrency, process concurrency (independent
  connections), persistence across restart, and stale recovery are all tested. This remains a
  single-node store, **not** distributed execution.
* **Provenance canonicalization:** `sha256_json` = sorted keys + compact separators + UTF-8 +
  `allow_nan=False`. This is Python-oriented and is **not** RFC 8785; byte-identical
  cross-language hashing is **not** claimed. Schema version is stable (1.0.0).
* **Verification foundation:** `hydroma/verification.py` runs a model executor over shared
  vectors and returns a `VerificationReport` with status `PASS / FAIL / INCOMPLETE`. It is
  software verification only and **never** promotes maturity or scientific status.
* **API local boundary (verified):** `run_local.py` defaults to `127.0.0.1` and refuses a
  non-loopback host without an explicit `--allow-external` flag (tested).

## Spatial / STAC / tiling interfaces (Phase 2.1 extension)

These are **optional, dependency-free interfaces**, not new infrastructure. They
describe data; they do not serve it.

* **Spatial metadata (`spatial.py`)** — port of `packages/scientific/src/spatial.ts`.
  `SpatialMetadata` = `crs` + `domain` (raster / vector / grid / h3 / point /
  polygon) + optional `extent` (bbox + crs) and `resolution`. Same validation
  rules as the TypeScript contract (e.g. h3 needs a numeric `resolution`, grid
  needs numeric `cellSize` + `unit`).
* **Data artifacts (`data.py`)** — port of `packages/scientific/src/data.ts`.
  A `DataArtifact` is a *reference* (id / kind / uri / mediaType) plus optional
  checksum, unit, spatial, temporal, license, quality. The engine never opens the
  URI. `is_raster_media_type()` identifies COG/GeoTIFF/NetCDF/HDF5/Zarr.
* **STAC (`stac.py`)** — minimal, dependency-free, **STAC 1.0.0-compatible**
  subset: `Asset`, `Link`, `Item`, `Collection`, `Catalog`, plus
  `item_from_data_artifact()` to map a `DataArtifact` onto a STAC Item (asset
  href + checksum + `eco-nojin:data:*` properties + license). Implements only
  what HyDroMA uses; no extensions, no STAC API, no schema validation, no I/O.
  Targets STAC 1.0.0 (broad interoperable baseline); PySTAC's newer 1.1.0
  default is noted but not adopted.
* **Tiling (`tiling.py`)** — provider-agnostic tile-request description and a
  TiTiler-compatible URL builder. **No TiTiler / rio-tiler / rasterio dependency.**
  TiTiler is the reference implementation only; the engine neither installs nor
  runs it, and tiles are visualisation, never scientific calculation.

**Test status:** these interfaces are covered by `test_spatial.py`,
`test_data.py`, `test_stac.py`, `test_tiling.py` and `test_boundaries.py`. They
are software-verified only; **scientific validation is NOT performed**.

## Scientific data catalogue — `hydroma/catalogue.py`

A minimal, persistent, **dependency-free** catalogue that makes the STAC/DataArtifact
capability persistently usable and searchable. SQLite (stdlib `sqlite3`), no new
dependency, local-first, single-node. It stores **metadata and asset references
only** — it never opens, downloads or resolves the referenced assets.

### Storage schema

| Table | Columns | Purpose |
|---|---|---|
| `items` | `id` PK, `collection`, `datetime`, `bbox_min_x/min_y/max_x/max_y`, `stac_json`, `checksum`, `created_at` | One row per STAC Item; `stac_json` is the full canonical Item |
| `item_assets` | `item_id` FK, `key`, `href`, `media_type`, `checksum` (PK `item_id,key`) | Asset references; indexed on `media_type` |
| `collections` | `id` PK, `stac_json`, `created_at` | One row per STAC Collection |

`PRAGMA foreign_keys = ON`; `PRAGMA user_version` tracks `CATALOGUE_SCHEMA_VERSION`.

### Operations

* `register_item(item, overwrite=False)` — validate + persist. **Duplicate ID raises
  `DuplicateItemError`; nothing is overwritten** unless `overwrite=True` is explicit.
* `register_collection(collection, overwrite=False)` — same duplicate semantics.
* `get_item(id)` / `get_item_dict(id)` / `item_exists(id)` — retrieval by stable ID.
* `get_collection(id)` / `list_collections()`.
* `list_items(collection=, item_id=, media_type=, start=, end=, bbox=, limit=, offset=)`
  — combined AND filters, deterministic order (datetime asc, nulls last, then id).
* `to_catalog(id=, description=)` — serialise the catalogue as a STAC `Catalog` of
  `item://<id>` links (description only; links are not resolved).
* `count()`, `close()`, context-manager support.

### Query semantics (exact)

* **Collection** — exact match on the Item's `collection`.
* **Item ID** — exact primary-key match.
* **Media type** — Item matches if *any* asset's base media type (parameters
  stripped, case-insensitive) equals the query media type.
* **Temporal** — a query `[start, end]` matches an Item when its point `datetime`
  is within the window (inclusive, open bounds allowed), **or** its
  `start_datetime`/`end_datetime` interval *overlaps* the window. Items with **no**
  temporal metadata are **excluded** when a temporal filter is supplied (the store
  does not guess).
* **Bounding box** — bounding-box **overlap only** (inclusive edges; 3D 6-number
  bboxes reduced to 2D X/Y). This is **not** precise geometry and not a GIS engine.

### Limitations

* STAC 1.0.0 subset only; **not full STAC compliance**; no STAC API/search endpoint.
* No asset download/resolution/validation; references are opaque strings.
* Single-process/single-node; not a distributed catalogue.
* Catalogue is **independent of model execution** — registering/querying never runs a
  model, and no model depends on it.

**Test status:** `test_catalogue.py` (registration, persistence across restart,
duplicate handling, validation, collection/media/temporal/bbox filtering, boundary
cases, deterministic ordering, pagination, serialization, DataArtifact→Item
integration, read-only DB error, context manager) + `test_boundaries.py`.
Software-verified only; **scientific validation is NOT performed**.

## Scientific models

### FAO-56 reference evapotranspiration (ET0) — `hydroma/fao56_et0.py`

FAO Irrigation and Drainage Paper 56 (Allen et al., 1998), Penman-Monteith, daily step:

```
ET0 = [0.408·Δ·(Rn−G) + γ·(900/(T+273))·u2·(es−ea)] / [Δ + γ·(1 + 0.34·u2)]
es = 0.6108·exp(17.27·T/(T+237.3));  Δ = 4098·es/(T+237.3)²;  γ = 0.000665·P
P  = 101.3·((293 − 0.0065·z)/293)^5.26
```

Inputs: `rn` (MJ/m²/day), `t` (°C), `u2` (m/s), `ea` (kPa); optional `g` (default 0, daily),
`z` (m, default 0 = sea level). Output: `et0_mm_per_day` + intermediates (`es`, `Δ`, `γ`, `P`).
Rejects non-finite/negative/invalid inputs and unit mismatches; warns `ES_LT_EA`, `HIGH_WIND`
(u2 > 3), `NEGATIVE_ET0` (condensation). **Maturity `tested`, scientific status `NOT_VALIDATED`.**
Reference vectors in `tests/vectors/fao56_et0_vectors.json` (independently hand-derived). Registered
in the runtime and listed by `GET /v1/models`; runs via `POST /v1/runs`.

### Water Balance — `hydroma/water_balance.py`

Root-zone balance `ΔS = P + I + CR − ET − R − DP` (mm). Faithful port of the TypeScript
reference (`packages/scientific`), with cross-language parity vectors. Maturity `tested`,
scientific status `NOT_VALIDATED`.

### Soil Water Storage — `hydroma/soil_water.py`

Multi-layer root-zone water availability. Each layer is described by `top`/`bottom`
depths (from the surface) **or** `thickness` (stacked from the surface), plus
`theta_fc`, `theta_wp`, and optional `theta_actual` (volumetric water content m³/m³).
An optional `rootZoneDepth` selects the effective root zone; a layer straddling the
root-zone boundary contributes **only the intersected thickness**.

```
Z          = effective layer thickness within the root zone   [mm]
TAW        = Σ (theta_fc − theta_wp) · Z                     [mm]
storage    = Σ theta_actual · Z                              [mm]  (theta_actual for all layers)
available  = Σ (theta_actual − theta_wp) · Z                 [mm]  (above wilting point)
depletion  = Σ (theta_fc − theta_actual) · Z                 [mm]
RAW        = p · TAW                                         [mm]  (if p supplied)
remaining  = TAW − depletion   (= available)
depletion_fraction = depletion / TAW                         (null if TAW = 0)
```

Units are explicit: depths accept bare numbers (mm) or length quantities (mm/cm/m,
converted via the units contract); θ accepts bare numbers or dimensionless quantities
(m³/m³); `p` is a fraction in (0, 1].

Validates: layer contiguity/ordering (`LAYER_GAP`, `LAYER_OVERLAP`), coverage of
`rootZoneDepth` (`INCOMPLETE_COVERAGE`, never extrapolates), `theta_fc > theta_wp`
(`THETA_FC_MUST_EXCEED_WP`), `0 ≤ θ ≤ 1` (`INVALID_THETA`), thickness > 0, `0 < p ≤ 1`,
all-or-none `theta_actual` (`INCOMPLETE_THETA_ACTUAL`), and unit mismatches
(`UNSUPPORTED_UNIT`). Out-of-range θactual (above FC / below WP) is **flagged, never
clamped**. `status` ∈ {`no_actual_water`, `zero_taw`, `at_field_capacity`,
`readily_available`, `stressed`, `above_field_capacity`, `at_or_below_wilting_point`};
`stress_reached` is a boolean diagnostic (depletion ≥ RAW). Does **not** estimate
hydraulic properties, infiltration, drainage, evaporation, capillary rise, percolation
or crop water requirements. **Maturity `tested`, scientific status `NOT_VALIDATED`.**
Reference vectors: `tests/vectors/soil_water_vectors.json`. Registered in the runtime;
runs via `POST /v1/runs`.

### Daily Root-Zone Water Dynamics — `hydroma/daily_soil_water.py`

Crop-neutral daily accounting (FAO‑56 Ch.5 tipping bucket). Per day:

```
candidate = storage + precipitation + irrigation − runoff − et_actual
excess    = max(0, candidate − fc_storage)      # above field capacity -> drainage (assumption)
storage_next = candidate − excess
```

Conservation (exact): `storage + P + I = runoff + et_actual + excess + storage_next`.
Storage is never clamped: `et_actual + runoff` may exceed available water → `storage_next`
goes negative and is flagged `below_zero`. `et_actual` is **supplied** (never inferred from
ET0). Requires explicit `initial_storage_mm` (no default). `status` ∈ {`at_field_capacity`,
`readily_available`, `stressed`, `at_or_below_wilting_point`, `below_zero`}. **Simplified
accounting — NOT Richards, conductivity, redistribution, capillary rise, groundwater,
evaporation/transpiration partitioning, crop growth/yield, or validated drainage/runoff.**
Maturity `tested`, scientific status `NOT_VALIDATED`. Reference vectors:
`tests/vectors/daily_soil_water_vectors.json`. Registered; runs via `POST /v1/runs`.

### FAO-56 Crop Water (Kc / Ks / ETc) — `hydroma/crop_water.py`

Single crop-coefficient FAO-56 with depletion-based water stress:

```
ETc_potential = Kc * ET0
RAW           = p * TAW
Ks            = 1                        if Dr <= RAW
              = (TAW - Dr) / (TAW - RAW) if RAW < Dr < TAW
              = 0                        if Dr >= TAW
ETc_adjusted  = Ks * ETc_potential
```

Boundary semantics: `Dr<=RAW` (incl. `Dr<0` above field capacity) → Ks=1; `Dr>=TAW`
(below wilting) → Ks=0; `p=1` → no stress buffer (Ks=1 until Dr=TAW); `TAW=0` → Ks=1
at Dr≤0 else 0. ET terminology kept distinct: **ET0 → ETc_potential (demand) → Ks →
ETc_adjusted → actual ET → unmet demand**. Single-Kc approach, **not** dual-source.
Kc and p are supplied (crop-neutral), never inferred.

Two entry points:
- `compute_crop_water` — single day (ET0, Kc, p, TAW, Dr → ETc_potential, Ks, ETc_adjusted).
- `simulate_crop_water_chain` — multi-day, **additive** and physically consistent. It does
  **not** modify `daily_soil_water`; it applies its own balance per day:

  ```
  Dr_start   = S_FC - S
  Ks         = compute_ks(Dr_start, TAW, RAW)
  ETc_adj    = Ks * Kc * ET0
  excess     = max(0, (S + P + I - runoff) - S_FC)     # above FC -> bucket drainage (reported)
  available  = max(0, (S + P + I - runoff - excess) - S_WP)
  actual_ET  = min(ETc_adj, available)                  # ET limited to water above WP
  unmet      = ETc_adj - actual_ET                      # reported, never removed
  S_final    = S + P + I - runoff - excess - actual_ET
  ```

  Conservation `S + P + I = runoff + excess + actual_ET + S_final` is checked and reported.
  Layer parsing / FC / WP / TAW are reused from `soil_water.root_zone_storage_terms`
  (no duplicated soil math).

Maturity `tested`, scientific status `NOT_VALIDATED`. Reference vectors:
`tests/vectors/crop_water_vectors.json`. Registered; runs via `POST /v1/runs`.

### Irrigation Scheduling — `hydroma/irrigation.py`

Standalone, depletion-based (FAO‑56). Given `layers`, `p`, `depletion_mm` (Dr), and an
optional target, compute:

```
TAW = sum((theta_fc - theta_wp)*dz);  RAW = p*TAW
current storage = fc_storage - Dr
target depletion = target_depletion_mm | (fc_storage - target_storage_mm) | RAW (default)
net irrigation  = max(0, Dr - target_depletion)
gross irrigation= net / application_efficiency   (if 0 < efficiency <= 1)
irrigation_recommended = net_irrigation > 0       (aligned with the management target)
```

`depletion_to_raw_mm` (RAW−Dr) and `depletion_to_wp_mm` (TAW−Dr) are **signed headroom**:
> 0 = remaining before the threshold, 0 = at the threshold, < 0 = already beyond it (never clamped).
Stress threshold (`Dr > RAW`) is distinct from the wilting-point boundary (`Dr = TAW`).
`Dr<0` = above field capacity; `Dr>=TAW` = below wilting. No clamping; invalid inputs
(p≤0, target<0, eff∉(0,1], conflicting target) rejected. Crop-neutral (Kc/p supplied).
Maturity `tested`, scientific status `NOT_VALIDATED`. Reference vectors:
`tests/vectors/irrigation_vectors.json`. Registered; runs via `POST /v1/runs`.
## Phase 3.10 — Ingestion & Quality-Aware Acceptance (`hydroma/ingestion.py`)

Pipeline: `SOURCE -> INGEST -> NORMALIZE -> CONTRACT VALIDATION -> QC -> ACCEPTANCE -> MODEL_READY | REJECTED | PENDING_REVIEW`.
Reuses `climate_import` (CSV/JSON/in-memory), `climate.validate_series`, `quality.assess_climate_quality`, `units`.
`decide_acceptance` precedence: contract invalid -> STRICT UNIT_MISSING -> QC ERROR (if error_blocks) -> domain QC unavailable (PENDING_REVIEW) -> review_required -> QC WARNING (if warn_blocks) -> ACCEPTED_WITH_WARNINGS -> ACCEPTED.
Only ACCEPTED/ACCEPTED_WITH_WARNINGS become MODEL_READY (`build_model_ready_dataset` enforces the gate). `et0_from_model_ready` consumes only MODEL_READY data (reuses `fao56_et0`).
Provenance records distinct hashes: source/normalized/config/qc_config/result.
**Not wired into generic `run_workflow()`** (out of scope). CRS-aware spatial QC not implemented. Scientific status **NOT_VALIDATED**.

## Phase 3.10.1 — CRS safety & module reconciliation

- **Canonical ingestion entry point:** `hydroma.ingest` (`ingest_climate` / `to_climate_series`). `hydroma.ingestion` re-exports it and adds Phase 3.10 acceptance utilities (`decide_acceptance`, `et0_from_model_ready`, `run_ingestion_pipeline`).
- **CRS safety:** `SpatialContext` now carries an optional `crs` (never inferred). Geographic lat/lon bounds are applied **only** when `crs` is a supported geographic CRS (`is_geographic_crs`: EPSG:4326/CRS84/WGS84/...). For projected or unknown/absent CRS, geographic bounds are **not** applied; an explicit `SPATIAL_BOUNDS_NOT_EVALUATED` finding is emitted instead (no silent success). No coordinate transformation is performed.
- **Non-claims:** no CRS registry/transform framework; CRS-aware QC beyond the tested cases is not claimed. Scientific status **NOT_VALIDATED**.

## Phase 3.11 — Generic workflow QC integration

`run_workflow()` is now quality-aware when a workflow declares `qc=WorkflowQCConfig(enabled=True)`:
- **Input QC:** after input contract validation, `_qc_assess(kwargs, qc)` runs existing climate QC; blocking findings -> step `FAILED` (`QC_BLOCKED_INPUT`); `QC_UNAVAILABLE` + `on_unavailable="skip"` -> `SKIPPED`.
- **Output QC:** after output contract validation, `_qc_assess(output, qc)`; blocking -> `QC_BLOCKED_OUTPUT` (dependent steps skip via existing dependency model).
- **Policy:** `QualityControlPolicy.error_blocks_execution` / `warn_blocks_execution` are enforced via `qc_blocks_execution`; statuses `QC_PASSED/QC_WARNING/QC_BLOCKED/QC_UNAVAILABLE/QC_NOT_EVALUATED`.
- **Backward compatible:** `qc=None` (default) preserves legacy behavior (no QC). `provenance.qc_config` records the effective config.
- Non-climate data -> `QC_UNAVAILABLE` (never silently QC-passed). No second QC engine; CRS safety preserved. Scientific status **NOT_VALIDATED**.

### FAO-56 Crop ET (ETc = Kc * ET0) - `hydroma/crop_etc.py`

Focused crop water-demand model: `compute_crop_etc({et0_mm, kc, period?})` -> `ETc = Kc*ET0` (mm over the stated period; Kc dimensionless, supplied). Validates et0>=0, kc>=0, period in {day,period}; rejects non-finite/negative. Crop-neutral (no Kc inference), no soil-water stress / irrigation requirement / yield. Maturity `tested`, scientific status **NOT_VALIDATED**. Registered as `eco-nojin.hydroma.fao56-crop-etc`; runs via `POST /v1/runs`.

## Phase 3.14 - Effective precipitation & preliminary crop water balance (`hydroma/effective_precip.py`)

- `compute_effective_precipitation({precipitation_mm, curve_number, period?})` - USDA‑SCS Curve Number method: `S=25400/CN-254; Ia=0.2S; RO=(P-Ia)^2/(P+0.8S) if P>Ia else 0; Pe=P-RO`. Requires explicit CN (0<CN<=100); rejects negative/non-finite P, invalid/missing CN.
- `compute_preliminary_water_balance({effective_precipitation_mm, etc_mm, period?})` - `balance = Pe - ETc`; status `surplus`/`balanced`/`deficit` (preliminary accounting only, NOT root-zone storage or irrigation requirement).
- Registered as `eco-nojin.hydroma.effective-precipitation` and `eco-nojin.hydroma.water-balance-prelim`. Maturity `tested`, scientific status **NOT_VALIDATED**. Reference: USDA‑SCS (1972); Chow et al. (1988).

## Phase 3.15 - Root-zone soil water balance (`hydroma/root_zone.py`)

`compute_root_zone_water_balance(input)` — FAO-56 root-zone bucket water balance (Allen et al. 1998, FAO 56 Ch.4). Single effective root zone; sequential daily state propagation; no soil-hydrology physics.

- **Storage bounds**: `S_WP = θwp·Zr`, `S_FC = θfc·Zr`, `TAW = (θfc−θwp)·Zr`, `RAW = p·TAW` [mm]; θ volumetric [m3/m3], Zr [mm].
- **Daily balance** (S = start-of-day storage): `candidate = S + P − RO + I`; `excess = max(0, candidate − S_FC)` (bucket drainage, not groundwater recharge); `available = max(0, after − S_WP)`; `actualET = min(ETc, available)`; `unmet = ETc − actualET`; `S_final = after − actualET`; `Dr = S_FC − S_final`.
- **Conservation**: `S + P + I = RO + excess + actualET + S_final` (reported as `balance.closes`).
- **Units**: depths/storage mm; θ m3/m3; `p` fraction. Bare numbers = mm / m3/m3; explicit length quantities converted via the units contract. No silent conversion.
- **Inputs**: `root_zone_depth_mm`, `theta_fc`, `theta_wp`, `initial_storage_mm`, `p?`, `days[]` ({date?, precipitation_mm, irrigation_mm?, runoff_mm?, etc_mm}).
- **Outputs**: TAW/RAW, per-day initial/final storage, actual ET, unmet, excess, depletion, status; totals + balance closure. Registered as `eco-nojin.hydroma.root-zone-water-balance`; maturity `tested`, scientific status **NOT_VALIDATED**. Reference: `tests/test_root_zone.py`.

## Upstream integration policy (see docs/architecture/UPSTREAM-INTEGRATION-REGISTER.md)

No upstream code is copied into `engines/`. `upstream-registry/` is read-only evidence.
- **LOW** (MIT/Apache/BSD/CC0/USGS-PD): adoptable via an **original** adapter (interface contract + wrapper), only after owner decision + ADR.
- **MED** (LGPL): legal review + ADR.
- **HIGH** (GPL/AGPL/EUPL): clean-room reimplement from contract; never vendor.
- No upstream code is currently present in `engines/hydroma` (verified).

## Phase 3.15 - Root-zone soil-water balance (`hydroma/root_zone_balance.py`)

Single-period root-zone balance with explicit soil properties, deep percolation and closure:
`candidate = S + P + I - ET - RO - DP; excess = max(0, candidate - fc_storage); S_next = candidate - excess`.
Also reports `TAW`, `depletion = fc - S_next`, `residual = (S_next - S) - measured` and `closure = |residual| <= max(1, 0.02*inflows)`.
Distinct from `daily_soil_water` (multi-day time-stepper) and `soil_water` (TAW/storage). No clamping (negative storage flagged `out_of_domain`). Maturity `tested`, scientific status **NOT_VALIDATED**. Registered as `eco-nojin.hydroma.root-zone-balance`.

## Phase 3.16 - Integrated irrigation requirement & scheduling plan (`hydroma/irrigation_plan.py`)

Integration workflow (no duplicated science): `compute_irrigation_plan({et0_mm, kc, layers, initial_storage_mm, p, application_efficiency?, target_depletion_mm?})` reuses `crop_etc.compute_crop_etc` (ETc=Kc*ET0) + `irrigation.compute_irrigation_schedule` (net/gross/trigger). Computes fc/wp/TAW, `Dr=fc-S`, `net=max(0,Dr-target)`, `gross=net/eff`, `trigger=Dr>RAW`, `post=min(fc, S+net)`. Single-decision (not optimizer, not multi-day scheduler). Maturity `tested`, scientific status **NOT_VALIDATED**. Registered as `eco-nojin.hydroma.irrigation-plan`.

## Phase 3.18 - Multi-period sequential soil-water simulation (`hydroma/multi_period_sim.py`)

`simulate_multi_period({period_start, period_end, layers, initial_storage_mm, steps[]})` - explicit temporal contract (ISO period_start/end per step; contiguous, no overlap/gap; coverage of overall period), state transfer `S[t+1]=root_zone_balance(S[t],inputs[t])`, per-step mass-balance residual, per-step + overall provenance hashes. Fluxes are accumulated depths (mm); no interpolation/filling; missing rejected. Reuses `root_zone_balance` per step. Maturity `tested`, scientific status **NOT_VALIDATED**. Registered as `eco-nojin.hydroma.multi-period-simulation`.

## Phase 3.19 - Climate ingestion & QC acceptance gate (`hydroma/climate_qc_integration.py`)

`ingest_and_accept_climate(source, config, qc_policy)` reuses `ingestion.ingest_climate` + `climate.validate_series` + `quality.assess_climate_quality` + `ingestion.decide_acceptance` (Phase 3.10 precedence). Only `ACCEPTED`/`ACCEPTED_WITH_WARNINGS` → `model_ready`. `run_gated_simulation(source, config, sim_input)` runs `multi_period_sim` **only** if model_ready; rejected/pending → `BLOCKED` (never reaches the model). Direct-scalar input (farm_water_workflow) remains a separate, non‑QC mode. Maturity `tested`, scientific status **NOT_VALIDATED**. Registered as `eco-nojin.hydroma.climate-qc-gate`.

## Phase 3.19.3 - Acceptance policy, accumulation interval, QC semantics

- **M1 unit policy:** `ingest_and_accept_climate(..., unit_policy)` propagates LEGACY/STRICT to `decide_acceptance` and passes contract unit findings (no hardcoded LEGACY).
- **M2 accumulation interval:** `ClimateObservation` now carries optional `accumulation_start`/`accumulation_end`. `build_sim_input_from_climate` binds precipitation only when the observation's accumulation interval exactly equals the step `[period_start, period_end]`; missing -> `MISSING_ACCUMULATION_INTERVAL`, mismatch -> `ACCUMULATION_INTERVAL_MISMATCH`; timestamp-only matching is insufficient.
- **M3 mass-balance scope:** `verify_mass_balance` is an **algebraic closure check on recorded data** (detects tampering), NOT an independent physical/scientific validation.
- **M4 QC warning policy:** `QualityControlPolicy.warn_blocks_execution` defaults **False** (warnings non-blocking); `error_blocks_execution` defaults **True** (ERROR blocks). Configured plausibility thresholds do not block under the default policy.

## Phase 3.19.5 - Runtime execution, acceptance unification & provenance chain

- **Canonical acceptance everywhere:** `ingest_and_accept_climate` now delegates to `ingest.ingest_climate` (the canonical Phase 3.10 pipeline) instead of re-implementing contract/QC precedence. `LEGACY`/`STRICT`, structural-contract blocking and QC precedence are identical across `ingest_climate`, `ingest_and_accept_climate`, `run_gated_simulation`, `run_gated_simulation_from_climate` and the Runtime/API. The `startswith("UNIT")` finding filter was removed; unit findings come from the QC report (`RULE-UNIT-MISSING/UNKNOWN/INCOMPATIBLE`).
- **QC acceptance precedence aligned:** `ingestion.decide_acceptance` now returns `ACCEPTED_WITH_WARNINGS` / `QC_ERRORS_NONBLOCKING` for non-blocking QC errors (matching Phase 3.10), `QC_WARNINGS` for non-blocking warnings, `PASSED` for clean. `STRICT` treats missing/unknown/incompatible units as `STRICT_UNIT_MISSING`.
- **Runtime/API executor contract:** `execute_run` calls `executor(input_data)` with one dict. The multi-argument climate executors are wrapped by model-specific adapters (`climate_qc_gate_adapter`, `climate_sim_binding_adapter`) that validate required fields, coerce `config`/`qc_policy`/`source`, and return structured errors (`MISSING_INPUT`, `INVALID_INPUT`) instead of a raw `TypeError`. `eco-nojin.hydroma.climate-qc-gate` and `eco-nojin.hydroma.climate-sim-binding` now execute through the real Runtime/API path; rejected/pending climate is `BLOCKED`, never simulated.
- **Provenance chain:** `run_gated_simulation_from_climate` records `raw_source_hash -> normalized_series_hash -> qc_policy_hash -> qc_report_hash -> acceptance_hash -> mapping_hash -> simulation_input_hash -> final_result_hash`. Each hash's payload includes the previous stage's identity (accepted-series hash, mapping of the selected precipitation observations, canonical simulation input). `verify_climate_provenance(record)` recomputes the hashes from the stored payloads and detects tampering. The relationship survives JSON serialization/replay.
- **Accumulation contract preserved:** binding still requires exact `accumulation_start`/`accumulation_end`, exact period-end timestamp, `mm` unit, and no duplicate/ambiguous observation. Runtime/API adapters cannot bypass it (caller-supplied `precipitation_mm` in `sim_spec` is ignored).
- **CI:** `.github/workflows/verify.yml` runs the HyDroMA Python regression suite (`pytest`) in a dedicated `hydroma-python` job.

## Phase 3.20 - Climate-Driven Multi-Period Crop Water Workflow (`hydroma/climate_crop_workflow.py`)

`run_climate_crop_workflow(input)` orchestrates the **existing** models into one fail-closed pipeline: climate ingestion + contract + QC + acceptance (`ingest_and_accept_climate`) -> MODEL_READY gate -> FAO-56 ET0 (`climate_et0.compute_et0_series`) -> crop ETc = Kc*ET0 (`crop_etc.compute_crop_etc`) -> optional SCS-CN effective precipitation (`effective_precip.compute_effective_precipitation`) -> exact-accumulation precipitation binding -> multi-period soil-water simulation (`multi_period_sim.simulate_multi_period`). No model is reimplemented. Periods are whole days only (no implicit aggregation). ETc is crop **demand** and is never labelled actual ET (`et_source`/`et_is_actual` recorded per period). Irrigation is an explicit per-period net depth; the workflow never auto-schedules or applies an end-of-period recommendation to the same period. Effective precipitation is a separate accounting view, never summed with total precipitation. `verify_climate_crop_provenance(record)` recomputes acceptance/ET0/ETc/effective-precip/mapping/simulation-input/step/final hashes from stored payloads and detects tampering after JSON serialization. Registered as `eco-nojin.hydroma.climate-crop-workflow`; executes via Runtime/API. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.21 - Root-Zone Water Stress & Actual ET Modeling (`hydroma/water_stress.py`)

A simplified, explicitly documented FAO-56 depletion-based water-stress model. `TAW=FC-WP`, `RAW=p*TAW`, `Dr=FC-S`, `Ks=1` if `Dr<=RAW`, `(TAW-Dr)/(TAW-RAW)` if `RAW<Dr<TAW`, `0` if `Dr>=TAW`; `ETa=Ks*ETc`. `ETa` is a **model-derived stress-adjusted estimate**, never field-measured actual ET; `ETc` remains crop demand. Water balance uses only `ETa` (never ETc+ETa together): `S_next=S+P+I-ETa-RO-DP-Excess`, `Excess=max(0, candidate-FC)`. Total precipitation feeds the bucket; SCS-CN effective precipitation stays a separate diagnostic. `p` is the FAO-56 depletion fraction in the open interval `(0, 1)` and must be supplied explicitly (never inferred). `p = 1` is **excluded** with a structured `INVALID_P` error: it makes `RAW = TAW`, collapsing the stress interval and making the FAO-56 linear stress equation undefined (`TAW - RAW = 0`); this also removes the wilting-point boundary ambiguity (`Ks = 0` at `Dr >= TAW` for all valid `p`). Negative computed storage is flagged `OUT_OF_DOMAIN` and blocks the sequential run (no silent clamp). `compute_water_stress` (single period) and `compute_stress_aware_series` (sequential, reuses `root_zone_balance`) are registered as `eco-nojin.hydroma.water-stress`.

The climate-crop workflow gains an explicit `scenario` input: `DEMAND_BASED_NO_STRESS` (default, unchanged Phase 3.20 behaviour) or `STRESS_ADJUSTED_ET` (requires `p`; uses Ks/ETa). The scenario is recorded in the output and provenance; the two modes are distinguishable in results, mappings (`et_source`), provenance and replay. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.22 - Root-Zone Water Stress Dynamics & Domain Integrity (`hydroma/water_stress.py`)

Bounded domain-integrity hardening of the Phase 3.21 stress model (no equation changes):
- `TAW = FC - WP` must be `> 0`; a non-positive TAW is rejected (`TAW_NONPOSITIVE`) rather than divided by (soil validation already rejects `theta_fc <= theta_wp`).
- Near-zero TAW (`< 1e-6` mm) is a valid but extreme state, flagged `near_zero_taw` (not failed).
- `Ks` is bounded to `[0, 1]` (defensive clamp; never triggers for valid input); `ETa = Ks*ETc` therefore never exceeds `ETc` (`eta_exceeds_etc` sanity flag).
- `S > FC` drains via `Excess` (mass-conservative, `dr_above_fc`); `S < WP` yields `Ks = 0` (`dr_below_wp`); negative storage is flagged `OUT_OF_DOMAIN` and blocks the sequential run (never clamped).
- Invalid/inconsistent soil parameters are rejected by `soil_water.validate_soil_water_input`; `p` remains `(0, 1)`.

New result fields: `near_zero_taw`, `dr_above_fc`, `dr_below_wp`, `eta_exceeds_etc`. Existing Phase 3.20/3.21 behaviour, provenance and API are unchanged. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.23 - Stress-Aware Irrigation Demand & Decision Support (`hydroma/irrigation_demand.py`)

`compute_irrigation_demand(input)` is a deterministic decision-support calculation that reuses `crop_etc` (ETc), `water_stress._ks` (Ks), `irrigation.compute_irrigation_schedule` (TAW/RAW/Dr/net/gross/target) and `soil_water.validate_soil_water_input` (layers). It distinguishes crop water demand (`etc_mm`), root-zone depletion (`depletion_mm`), stress deficit (`stress_deficit_mm = max(0, Dr-RAW)`), water deficit to target (`water_deficit_mm`), net irrigation (`net_irrigation_mm`), gross irrigation (`gross_irrigation_mm = net/efficiency`, only when an explicit valid efficiency is supplied) and irrigation losses. The target is explicit (`target_depletion_mm`, `target_storage_mm`, or `target_policy` in `{FIELD_CAPACITY, RAW}`); field capacity is never assumed and `p`/efficiency are never inferred. Decision: `DEMAND`, `NO_DEMAND`, `OUT_OF_DOMAIN` (below wilting point), or `INVALID` (structured error). Net (not gross) is what enters root-zone storage. Registered as `eco-nojin.hydroma.irrigation-demand`; executes via Runtime/API; **decision support only — never executes irrigation**. Maturity `tested`, scientific status **NOT_VALIDATED**.

### Phase 3.23.1 corrections
- **Decision semantics:** `demand_detected` (numerical, `net>0`, any domain) is now distinct from `irrigation_recommended` (operational, only within `[WP, FC]`). Below wilting point: `decision=OUT_OF_DOMAIN`, numerical `net_irrigation_mm` preserved, `irrigation_recommended=False`, `recommendation_restricted=True`, `restriction_reason=BELOW_WILTING_POINT` (no contradiction).
- **Temporal semantics:** `calculation_type=CURRENT_STATE_TARGET_REPLENISHMENT`, `temporal_basis=current_state` — a current-state target top-up, not a forecast; `ks_eta_role=informational_stress_diagnostics` (Ks/ETa do not enter `net = max(0, Dr - target)`).
- **Target integrity:** exactly one target source (else `CONFLICTING_TARGET`); unknown `target_policy` → `INVALID_TARGET`; target must lie within `[WP, FC]` (target depletion in `[0, TAW]`) else `INVALID_TARGET`.
- `storage_after_irrigation_mm` documented as `initial_storage + net_irrigation` (no ET/other fluxes).

## Phase 3.24 - Sequential Irrigation Demand Integration & Application Scenario

The climate-crop workflow gains a third scenario, `IRRIGATION_APPLICATION`, alongside `DEMAND_BASED_NO_STRESS` (Phase 3.20) and `STRESS_ADJUSTED_ET` (Phase 3.21). It runs the existing stress-aware sequential soil-water simulation (`compute_stress_aware_series`, reusing `root_zone_balance` and `crop_etc`) with the **explicit** per-period `irrigation_mm`, and then — for each period — calls the Phase 3.23 `compute_irrigation_demand` at that period's **start-of-period storage** to report the calculated demand. Calculated demand and explicit application are kept distinct: `calculated_net_demand_mm`, `calculated_gross_demand_mm`, `explicit_applied_irrigation_mm`, `demand_application_difference_mm`, `demand_decision`. The explicit irrigation enters the balance **exactly once** (the demand is never auto-applied); net (not gross) is the root-zone input; no efficiency double-counting. Per-period demand failures (e.g. invalid target) are preserved as `demand_decision="INVALID"` without aborting the application scenario. A `demand_hash` is added to the provenance payloads and verified by `verify_climate_crop_provenance`. Registered/executed via the existing Runtime/API path. Maturity `tested`, scientific status **NOT_VALIDATED**; decision support/simulation only — no irrigation execution.

## Phase 3.25 - Irrigation Scenario Outcome Analysis

`IRRIGATION_APPLICATION` now also returns `irrigation_analytics = {periods, summary}` derived only from existing scenario outputs (no new water balance, no second demand model). Per period: `calculated_net_demand_mm`, `calculated_gross_demand_mm`, `explicit_applied_irrigation_mm`, `demand_application_difference_mm`, `demand_coverage_fraction`, `demand_fulfillment_status` (`NO_DEMAND`/`FULLY_MET`/`PARTIALLY_MET`/`UNMET`/`INVALID`), `unmet_demand_mm`, `application_excess_mm`, `storage_before/after/change_mm`, `period_et0/etc/eta/precipitation/effective_precipitation/runoff/deep_percolation_mm`, `domain_status`. Coverage convention: `min(applied/demand, 1)` for positive demand, `1.0` for zero demand, `None` for invalid. Summary: totals (applied, valid demand, unmet, excess), period counts (positive demand, fully met, unmet), `overall_demand_coverage_fraction` (derived from totals, never by averaging percentages), storage trajectory (initial/final/change/min/max) and cumulative fluxes. An `analytics_hash` is added to provenance and verified. Analytical only — not irrigation efficiency, loss, yield or agronomic optimality. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.26 - Scientific Validation Framework & Reference Dataset Contract (`hydroma/evaluation.py`)

A lightweight, deterministic model-evaluation framework (no scientific validation). Dataset contract: `dataset_id`, `version`, `role` (`REFERENCE|CALIBRATION|VALIDATION|EVALUATION`), `variable`, `unit`, `observations[{variable,value,unit,timestamp,spatial_id?,quality_flag?,uncertainty?,source?,method?}]`; missing values explicit (`value=None`/`quality_flag="missing"`), nothing inferred; `dataset_hash` for integrity. Matching: deterministic by variable/unit/time (exact or explicit tolerance)/optional spatial id; no interpolation, resampling or timezone normalization; duplicates ambiguous. Metrics: MAE, RMSE, Bias, NSE, KGE with structured statuses (`OK`/`NO_DATA`/`UNDEFINED_ZERO_VARIANCE`/`UNDEFINED_INSUFFICIENT_SAMPLE`/`UNDEFINED`). Report: model/dataset identity + hashes, matching results, metric values/statuses, sample/missing/excluded counts, period, limitations, `result_hash`; `verify_evaluation_report` recomputes dataset + result hashes and detects tampering. `expected_role` rejects using a calibration dataset as validation. Computing metrics never changes model maturity or scientific status. Registered as `eco-nojin.hydroma.model-evaluation` (domain `simulation`); executes via Runtime/API. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.27 - Model Output Evaluation Integration & Reference Matching

The evaluator now accepts a **model run** directly (`run` + `output_mapping`) in addition to pre-extracted `model_outputs`. `extract_model_outputs(result, mapping)` uses an explicit mapping (`items_path`, `value_field`, `timestamp_field`, `spatial_field?`, `variable`, `unit`) to pull evaluator-ready outputs from a run's `result_json` — no values, timestamps or spatial ids are inferred. `evaluate_run(run, dataset, output_mapping, matching, expected_role, model)` extracts, evaluates via the Phase 3.26 `evaluate_model_output`, and preserves run identity (`run_id`, `model_id`, `model_version`, `status`, `created_at`) inside the report core (hash-covered). Structured statuses: `NO_RUN_RESULT`, `NO_MODEL_OUTPUTS`, `ROLE_MISMATCH`, `INVALID_RUN`. The registered `eco-nojin.hydroma.model-evaluation` adapter dispatches to run-evaluation when `run` is supplied, else direct model-output evaluation. Matching, metrics and integrity semantics are unchanged. Evaluation never changes model maturity or scientific status. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.28 - Scientific Evaluation Protocol & Dataset Independence Controls

Two narrowly scoped additions to the Phase 3.26/3.27 framework (no model/equation/maturity changes). (1) `assess_dataset_independence(dataset_a, dataset_b)` conservatively assesses whether two role-assigned datasets may conflict, using only supplied metadata: observation-identity overlap (explicit `observation_id`, else `(variable,unit,timestamp,spatial_id)` tuple), timestamp overlap, spatial-id overlap, same-role indicator, and dataset id/version integrity. Status precedence `OVERLAP_DETECTED > POTENTIAL_OVERLAP > INDETERMINATE > INDEPENDENT`; insufficient metadata yields `INDETERMINATE` (a lack of matching IDs never proves independence), and every result carries the limitation that no evidence of overlap is not proof of scientific independence. (2) `build_evaluation_protocol(model, dataset, reference_dataset?, variable?, unit?, matching?, expected_role?)` produces a deterministic protocol with id/version, model identity, dataset ids/versions/roles/hashes, variable/unit, matching policy, independence assessment and status (`READY`/`INDETERMINATE`/`CONFLICT`), plus a `protocol_hash` verified by `verify_evaluation_protocol` (tamper-evident, JSON-safe). Registered as `eco-nojin.hydroma.evaluation-protocol` (domain `simulation`); executes via Runtime/API. Maturity `tested`, scientific status **NOT_VALIDATED**; independence is **not** scientifically proven.

## Phase 3.30 - First Real-Data Soil Water Balance Evaluation (SCAN 2046)

`examples/prepare_scan_2046.py` is a reproducible real-data pipeline (no synthetic data). It reads the USDA NRCS SCAN daily soil-moisture (SMS) and weather (WEATHER) CSV exports for site 2046 (Perthshire, MS), calendar year 2024, derives root-zone storage from the 2/4/8/20/40 in sensors using documented midpoint layer boundaries (0/3/6/14/30/40 in), derives net radiation from measured solar radiation (FAO-56), computes ET0 with the existing `fao56_et0`, runs the stress-aware sequential model (`water_stress.compute_stress_aware_series`, Phase 3.21) over the longest contiguous run of complete days, and evaluates simulated vs observed storage with the Phase 3.26 evaluator. First run (2024-01-01..2024-09-29, 272 scored days): MAE 299.2 mm, RMSE 302.1 mm, Bias −299.2 mm, NSE −15.65, KGE 0.316 — a large negative bias caused by the documented loam θ_fc/θ_wp assumptions (0.27/0.12) being far below the observed θ regime (~0.36–0.65). This is a **preliminary empirical evaluation, not scientific validation**; Kc=1.0, p=0.5, loam parameters, zero irrigation/runoff/deep-percolation and midpoint layer integration are explicit assumptions. Maturity `tested`, scientific status **NOT_VALIDATED**.

## Phase 3.31 - Agronomy, Drought, Pest & Groundwater Model Family

Six bounded, deterministic, stdlib-only reference models added (no third-party
dependency, empty dependency set preserved). Each is software-`tested` and
scientifically **NOT_VALIDATED**; each publishes the full contract
(inputs/outputs/assumptions/limitations/references/validation/provenance fields)
and is registered in the Runtime/API. None changes an existing model.

* **Drought index — `hydroma/drought.py`** (`eco-nojin.hydroma.drought-index`,
  domain `drought`). Empirical standardized index (SPI/SPEI-style):
  `index_i = Phi^-1((rank_i - 0.44)/(n + 0.12))` (Hazen plotting position +
  Acklam inverse-normal CDF). `mode` = `SPI` (precipitation series) or `SPEI`
  (P − ET0 series). Reports per-value class (McKee 1993). **Not** the gamma-fit
  operational SPI; no seasonal grouping. Ref: `tests/test_drought.py`.
* **Chilling & bloom — `hydroma/chilling.py`** (`eco-nojin.hydroma.chilling`,
  domain `agriculture`). `compute_chilling` (Chilling Hours 0–7.2 °C + Utah
  chill units, Richardson 1974); `estimate_bloom` (simplified chill-then-heat:
  first day cumulative Utah chill ≥ requirement AND cumulative GDD ≥ bloom_gdd).
  `chilling_adapter` dispatches on input shape for the single registered executor.
  No chill-portions/Dynamic Model. Ref: `tests/test_chilling.py`.
* **Crop growth & yield — `hydroma/crop_growth.py`**
  (`eco-nojin.hydroma.crop-growth`, domain `crop`). Monteith (1977) RUE:
  `dB = RUE·PAR·f_temp·f_water`; `Biomass = Σ dB`; `Yield = Biomass·HI`
  (`1 g/m² = 0.01 t/ha`). Cardinal-temperature response; supplied `ks` (default
  1.0). No CO2/nutrient/phenology partitioning. Ref: `tests/test_crop_growth.py`.
* **Pest risk — `hydroma/pest_risk.py`** (`eco-nojin.hydroma.pest-risk`,
  domain `agriculture`). `degree_day` mode (base + optional cap, biofix
  `required_dd` → event day) and `suitability` mode (CLIMEX-lite
  `f_temp·f_moist` → band). Not an operational forecast; no species calibration.
  Ref: `tests/test_pest_risk.py`.
* **Plant strengthening — `hydroma/plant_strengthening.py`**
  (`eco-nojin.hydroma.plant-strengthening`, domain `agriculture`). Heuristic
  weighted-mean resilience index over supplied factors in [0,1]
  (`silicon`, `isr`, `sar`, `biostimulant`; optional `weights`). Transparent
  aggregation only — no disease/yield prediction. Ref:
  `tests/test_plant_strengthening.py`.
* **Groundwater balance — `hydroma/groundwater.py`**
  (`eco-nojin.hydroma.groundwater-balance`, domain `groundwater`). Lumped
  single-bucket: `dS = recharge + lateral_in − discharge − pumping − lateral_out`.
  Storage never clamped (negative → `out_of_domain`/`depleted`). Not MODFLOW;
  no water quality. Ref: `tests/test_groundwater.py`.

All six execute through the real Runtime/API path (verified end-to-end with
provenance + `parameter_hash`). Full suite: **1357 passed**. Maturity `tested`,
scientific status **NOT_VALIDATED** for every model.

## Phase 3.32–3.36 - International-Standard Model Family (5 phases)

Seven new bounded, deterministic, stdlib-only reference models added across the
five prioritized phases (empty dependency set preserved; no existing model
changed). Each publishes the full contract and is registered in the Runtime/API;
all are software-`tested` and scientifically **NOT_VALIDATED**.

### Phase 3.32 — WMO drought (`hydroma/drought_wmo.py`, `eco-nojin.hydroma.drought-wmo`, domain `drought`)
* **Gamma-fit SPI** (Thom 1966; WMO 2012): method-of-moments gamma fit with
  zero-frequency adjustment and Acklam inverse-normal transform
  (`regularized_gamma_p` = regularized lower incomplete gamma). `method=spi_gamma`.
* **Z-index** (simplified Palmer anomaly of P − PET). `method=z_index`.
* **Simplified scPDSI** (single effective layer, supplied PET, α/β/γ/δ
  calibration + duration recursion `X_i = Z_i + 0.897·X_{i-1}`). Not NCDC scPDSI.
  `drought_wmo_adapter` dispatches on `method`. Ref: `tests/test_drought_wmo.py`.

### Phase 3.33 — FAO crop (`hydroma/crop_dual.py`)
* **Dual-Kc** (`eco-nojin.hydroma.dual-kc`, domain `crop`): FAO-56 Ch.7
  `ETc = (Ks·Kcb + Ke)·ET0`, `Ke = Kr·(Kc_max − Kcb)`; `Ke=0` when `De` absent.
* **AquaCrop-lite** (`eco-nojin.hydroma.aquacrop-lite`): `Biomass = WPb·ΣTr`,
  `Yield = HI·Biomass`. Ref: `tests/test_crop_dual.py`.

### Phase 3.34 — Soil physics (`hydroma/soil_physics.py`, `eco-nojin.hydroma.soil-physics`, domain `soil`)
* **RUSLE** `A = R·K·LS·C·P` (McCool LS when slope+length supplied).
* **Green-Ampt** ponded cumulative infiltration `F − c·ln(1+F/c) = K·t` (bisection).
* **Pedotransfer** (texture-based, Saxton-Rawls-inspired, simplified; θwp < θfc).
  `soil_physics_adapter` dispatches on `method`. Ref: `tests/test_soil_physics.py`.

### Phase 3.35 — Sustainability (`hydroma/water_footprint.py`)
* **Water footprint** (`eco-nojin.hydroma.water-footprint`, domain `water`):
  green/blue/grey (Hoekstra) → total m³/ton.
* **SDG 6.4.2 water stress** (`eco-nojin.hydroma.sdg-water-stress`):
  `withdrawal/renewable·100` + level. Ref: `tests/test_water_footprint.py`.

### Phase 3.36 — Groundwater MODFLOW-lite (`hydroma/groundwater_spatial.py`, `eco-nojin.hydroma.groundwater-spatial`, domain `groundwater`)
* **Darcy flow** `Q = K·A·(h1−h2)/L`; **1-D steady head with recharge**;
  **WTF recharge** `R = Sy·Δh/Δt`. Lumped/1-D, not a distributed solver.
  `groundwater_spatial_adapter` dispatches on `method`.
  Ref: `tests/test_groundwater_spatial.py`.

All seven execute through the real Runtime/API path (verified end-to-end with
provenance). Full suite: **1395 passed**. Maturity `tested`, scientific status
**NOT_VALIDATED** for every model.

## Phase 3.37–3.41 — Applied Science Model Family (5 phases)

Five new bounded, deterministic, stdlib-only models (each a single registered
model that dispatches on `method`; empty dependency set preserved; no existing
model changed). All software-`tested`, scientifically **NOT_VALIDATED**.

### Phase 3.37 — Agro-climate (`hydroma/agroclimate.py`, `eco-nojin.hydroma.agroclimate`, domain `climate`)
* **Thornthwaite PET** (1948) with day-length correction and annual heat index.
* **Priestley-Taylor ET0** (1972, α=1.26).
* **Aridity Index** (UNEP) `P/PET` + class.
* **Climate Normals** (WMO, descriptive n/mean/std/min/max/median).
  `agroclimate_adapter` dispatches on `method`. Ref: `tests/test_agroclimate.py`.

### Phase 3.38 — Surface hydrology (`hydroma/surface_hydrology.py`, `eco-nojin.hydroma.surface-hydrology`, domain `hydrology`)
* **IHA (simplified subset)** (Richter 1996); **Flow duration curve**;
  **7Q10** (10th percentile of 7-day minima); **Flood frequency** Gumbel (MoM)
  + Log-Pearson III (Wilson-Hilferty). `surface_hydrology_adapter` dispatches on
  `method`. Ref: `tests/test_surface_hydrology.py`.

### Phase 3.39 — Carbon & GHG (`hydroma/carbon.py`, `eco-nojin.hydroma.carbon-mrv`, domain `soil`)
* **RothC-lite** first-order SOC with Q10 temperature + moisture modifier.
* **DNDC-lite** N2O from N input × WFPS × temperature response.
* **IPCC MRV (Tier 1)** CO2 (44/12) + N2O (44/28) → CO2e (GWP AR6).
* **4per1000** 0.4%/yr target and gap. `carbon_adapter` dispatches on `method`.
  Ref: `tests/test_carbon.py`.

### Phase 3.40 — Water productivity & zoning (`hydroma/water_productivity.py`, `eco-nojin.hydroma.water-productivity`, domain `water`)
* **Water productivity** `Yield/ET` (kg/m³); **AEZ-lite** length of growing
  period (`P ≥ 0.5·PET`); **Water scarcity index** (withdrawal / (availability −
  EFR)). `water_productivity_adapter` dispatches on `method`.
  Ref: `tests/test_water_productivity.py`.

### Phase 3.41 — Biodiversity & stress (`hydroma/biodiversity_stress.py`, `eco-nojin.hydroma.biodiversity-stress`, domain `landscape`)
* **WBGT** (ISO 7243, indoor/outdoor); **THI** (NRC 1971); **Habitat quality**
  (InVEST-lite, threat-weighted); **Species suitability** (MaxEnt-lite / BIOCLIM
  envelope). `biodiversity_adapter` dispatches on `method`.
  Ref: `tests/test_biodiversity_stress.py`.

All five execute through the real Runtime/API path (verified end-to-end with
provenance). Full suite: **1436 passed**. Maturity `tested`, scientific status
**NOT_VALIDATED** for every model.

## Phase 3.42 — Remaining International Models (final batch)

Seven new bounded, deterministic, stdlib-only models (empty dependency set
preserved; no existing model changed). All software-`tested`, scientifically
**NOT_VALIDATED**.

* **Composite drought (EDO/GDO) + 2-layer scPDSI** — `hydroma/drought_composite.py`
  (`eco-nojin.hydroma.drought-composite`, domain `drought`). Weighted standardized
  component composite + a two-layer Palmer index (NCDC-lite, not full NCDC).
  Ref: `tests/test_drought_composite.py`.
* **Isotope hydrology** — `hydroma/isotope.py`
  (`eco-nojin.hydroma.isotope-hydrology`, domain `groundwater`). Deuterium
  excess (Dansgaard) + two-component mixing. Ref: `tests/test_isotope.py`.
* **GRACE equivalent water height** — `hydroma/remote_sensing.py`
  (`eco-nojin.hydroma.grace-anomaly`, domain `remote-sensing`). Mass anomaly →
  equivalent water height/volume (NLDAS is a data product, not modeled).
  Ref: `tests/test_remote_sensing.py`.
* **DSSAT/APSIM-lite crop** — `hydroma/crop_dssat.py`
  (`eco-nojin.hydroma.crop-dssat-lite`, domain `crop`). Thermal-time stage
  development + RUE biomass + stage harvest index (not full DSSAT/APSIM).
  Ref: `tests/test_crop_dssat.py`.
* **Watershed (PRMS-lite) + nutrient (SPARROW-lite)** — `hydroma/watershed.py`
  (`eco-nojin.hydroma.watershed-nutrient`, domain `hydrology`). Two-reservoir
  daily balance + first-order nutrient delivery. Ref: `tests/test_watershed.py`.
* **SDG indicators 6.4.1 / 2.4.1 / 15.3.1** — `hydroma/sdg_indicators.py`
  (`eco-nojin.hydroma.sdg-indicators`, domain `water`). Water-use efficiency,
  sustainable-agriculture share, degraded-land share. Ref:
  `tests/test_sdg_indicators.py`.
* **Rosetta-lite pedotransfer** — `hydroma/rosetta.py`
  (`eco-nojin.hydroma.rosetta-pedotransfer`, domain `soil`). Texture + OM →
  θ33/θ1500 (distinct from `soil_physics` simplified form; not full Rosetta).
  Ref: `tests/test_rosetta.py`.

All seven execute through the real Runtime/API path (verified end-to-end).
Full suite: **1470 passed** across **47 registered models**. Maturity `tested`,
scientific status **NOT_VALIDATED** for every model.

## Phase 3.43 — Calibration & Free-Data Connection

### Calibration (`hydroma/calibration.py`, `eco-nojin.hydroma.calibration`, domain `simulation`)
A stdlib-only (no scipy) parameter-estimation toolkit:
* `nelder_mead` (1965 simplex), `grid_search`, `objective_rmse`, `objective_nse`
  (consistent with the Phase 3.26 evaluation metrics), `calibrate_generic`.
* Registered `compute_calibration` fits `y = a·exp(-k·x)` by grid + Nelder-Mead,
  returning `a`, `k`, RMSE, NSE and provenance.
* Calibration **never** promotes maturity or scientific status; calibration and
  validation datasets must stay distinct. Ref: `tests/test_calibration.py`.

### Free-data connection (`hydroma/free_sources.py`)
A **data-layer adapter** (no network I/O; the core stays offline and
`test_boundaries` is preserved). It registers free, open sources and produces
STAC Items / DataArtifact *references* (never opens the asset):
* Sentinel-1/2 (ESA/Copernicus, CC BY-SA 3.0 IGO), Landsat 8/9 (USGS, public
  domain), MODIS LAI/ET (NASA), CHIRPS (UCSB, CC BY 3.0), ERA5 (ECMWF/Copernicus),
  GRACE-FO (NASA/JPL), SoilGrids 250m (ISRIC, CC BY 4.0), SRTM DEM (NASA/USGS).
* `build_data_artifact` / `build_stac_item` / `list_sources`; each source carries
  a `fetch_spec` (api/auth/assets) for a separate optional connector. The core
  never calls the URL. Ref: `tests/test_free_sources.py`.

Full suite: **1483 passed** across **48 registered models**. Maturity `tested`,
scientific status **NOT_VALIDATED** for every model.

## Phase 3.96 — Optional Environmental Data Connectors (`hydroma.connect`)

An **optional** package (never imported by the core; core `dependencies = []`
unchanged; optional groups `connect`/`raster`). Architecture: connectors →
acquisition (SSRF/path-traversal/size/timeout/bounded-retry, lazy `httpx`) →
cache (deterministic keys, atomic, SHA-256 verify, no silent overwrite) →
artifacts (core `DataArtifact` dict + distinct lifecycle statuses) → STAC →
adapters (`ClimateSeries`, `item_from_data_artifact`). Connectors: CHIRPS,
ERA5/ERA5-Land (distinct, auth-aware), Sentinel-2 (STAC discovery + asset; no
auto-NDVI). All tests offline via a fake transport; live acquisition opt-in.
Boundary/security/integration tests in `tests/test_connect_*.py`. ADR:
`docs/adr/ADR-0011-optional-environmental-connectors.md`. Report:
`docs/reports/phase-3.96-optional-environmental-connectors-acquisition-report.md`.
Full suite: **1532 passed**. Connectors are **NOT_VALIDATED** (reference-grade).

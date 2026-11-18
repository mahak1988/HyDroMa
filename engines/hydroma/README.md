# engines/hydroma — scientific engine

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

## Non-negotiable scientific contract

Every domain below must publish, before any implementation is accepted:

1. **Inputs** — variables, units, spatial/temporal resolution, required coverage.
2. **Outputs** — variables, units, aggregation level.
3. **Data sources** — provider, licence, version/date, retention.
4. **Model identity** — name, version, calibration dataset, code origin (upstream repo + commit).
5. **Provenance** — full run lineage (inputs → parameters → code version → outputs).
6. **Uncertainty** — method (ensemble, interval, RMSE…) and what is *not* quantified.
7. **Validation** — protocol, reference dataset, reported skill metrics, known failure modes.

Model files extracted into `upstream-registry` are **evidence, not executable code**. Nothing is
copied into this tree without a review record and an owner decision (D-17).

| Domain | Scope | Primary inputs | Required outputs |
|---|---|---|---|
| `water` | water balance, allocation, demand/supply accounting | precipitation, ET, withdrawals, storage | balance per basin/period, deficits |
| `hydrology` | rainfall–runoff, routing, flow regime | precipitation, DEM, land cover, gauges | discharge series, flow duration, extremes |
| `groundwater` | aquifer storage, recharge, drawdown | pumping, aquifer properties, recharge | head levels, recharge, safe yield |
| `soil` | soil water, properties, degradation indicators | texture, SOC, depth, land use | water content, property maps |
| `erosion` | soil loss and sediment | rainfall erosivity, slope, cover, management | soil loss rate, sediment yield |
| `climate` | climate indicators, projections, extremes | gridded climate, scenarios | indices, trends, projection bands |
| `meteorology` | weather series and downscaling | station/grid observations, reanalysis | bias-corrected series |
| `agriculture` | crop water requirement, yield response | weather, soil, crop parameters, management | ETc, irrigation need, yield estimates |
| `vegetation` | vegetation condition and productivity | remote sensing indices, climate | NDVI/LAI series, productivity |
| `remote-sensing` | ingestion, cloud masking, index derivation | imagery (Sentinel/Landsat), STAC | analysis-ready indices |
| `gis` | spatial reference, terrain, catchment delineation | DEM, boundaries, hydrography | catchments, slopes, spatial joins |
| `simulation` | model execution and calibration harness | model definitions, forcing data | run artefacts, calibration metrics |
| `scenarios` | scenario definition and comparison | baseline + interventions | scenario deltas, trade-off tables |
| `mrv` | measurement, reporting, verification evidence | interventions, measurements, models | verifiable claims with evidence chain |
| `model-registry` | model catalogue, versions, licences, status | model metadata | resolvable model references |

Status: skeleton. Subdirectories exist to hold the seven-part contract above per domain.

# data/ — data zones

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Data is separated by **trust level and processing stage**. Mixing them is a defect.

| Zone | Content | Rule |
|---|---|---|
| `raw` | untouched downloads | immutable; checksum recorded in `metadata` |
| `processed` | derived, reproducible from raw + code | must cite the transform version |
| `reference` | boundaries, admin units, lookups | versioned, licensed |
| `geospatial` | vector/raster layers | CRS declared |
| `climate` | gridded climate, projections | scenario + model version declared |
| `hydrology` | gauges, flow, basin data | station metadata required |
| `soil` | soil properties and profiles | depth/reference declared |
| `agriculture` | crop, management, yield | season and unit declared |
| `remote-sensing` | imagery and indices | sensor, date, cloud cover |
| `scientific-models` | model parameter sets | model version + provenance |
| `fixtures` | synthetic test data | must be labeled synthetic, never mixed with real |
| `metadata` | checksums, licences, provenance | required for every dataset |

Large or confidential data is **not committed**: see `.gitignore`. Real, sample, synthetic and
simulated data must never be indistinguishable in a filename or path.

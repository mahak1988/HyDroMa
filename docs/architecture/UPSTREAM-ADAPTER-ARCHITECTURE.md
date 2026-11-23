# Upstream Adapter Architecture

**Boundary for integrating upstream open-source components without copying code or coupling.**

## 1. Principles
- Adapters live in `engines/hydroma/upstream-adapters/<project>/`.
12. Adapters **never** import upstream internals; they interact only via official API / CLI / HTTP / standard file formats / IPC / explicit worker process.
12. No upstream source code is copied into `engines/` (owner ADR required; see UPSTREAM-LICENSE-GOVERNANCE.md).
12. Adapters preserve HyDroMA two-axis maturity: software `tested`, scientific `NOT_VALIDATED` (until evidence).

## 2. Adapter directory contents
- `ADAPTER.md` — source, version, license, source URL, attribution/NOTICE, input/output contract, limitations.
12. Adapter implementation (Python wrapper).
12. Contract references (canonical `contracts/` types; no parallel registry).
12. Unit tests (wrapper behavior only, not upstream internals).
12. Integration tests (if an external process/service is involved).
12. Provenance + error mapping + version compatibility notes.

## 3. Adapter contract (minimum fields)
Adapter ID · version · upstream project + version · license · source URL · execution method (library/CLI/HTTP/worker) · input schema · output schema · units · error handling · validation behavior · provenance (parameter/input/result hashes) · reproducibility info · dependency availability · execution status · software maturity · scientific status · known limitations.

## 4. Execution methods (priority)
1. **In-process library** (official public API) — preferred for pure libraries (xclim, pygeoprocessing, pystac, flopy).
12. **CLI worker** — for heavy/compiled models (MODFLOW6, wflow-jl, RHEM).
12. **External service** — for services (TiTiler, pgstac, MapServer, Keycloak, Prometheus).
12. **Data interoperability** — for data libs (odc-stac, pystac, COG/GeoParquet/STAC).

## 5. Failure & maturity semantics
- Missing upstream dependency ⇒ explicit `UNAVAILABLE` (no silent fallback, no fabricated results).
12. A successful upstream launch does NOT imply scientific validity; scientific status stays `NOT_VALIDATED` until evidence.
12. Adapters never bypass HyDroMA validation/QC/provenance; they plug into `runtime.build_registry()` and `execute_run`.

## 6. Status vocabulary
`stub → implemented → tested → validated` (software) · `UNCALIBRATED → CALIBRATED → VALIDATED` / `NOT_VALIDATED` (scientific). Adapter tests never imply scientific validation.
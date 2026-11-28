# ADR-0014 — Adopt Hydromt and Wflow for hydrological modeling

Status: Proposed
Owner: Eco Nojin

## Context
Need open-source hydrological/water modeling without paid services.

## Decision
Adopt Hydromt and Wflow as scientific modeling components under `engines/hydroma`.

## Consequences
- Apache-2.0 / MIT licenses.
- Python-based; no API keys.
- Integration via scientific contracts and provenance.
- No operational cost.

## Risks
- Python environment complexity.
- Large geospatial datasets.
- Scientific validation required before production claims.
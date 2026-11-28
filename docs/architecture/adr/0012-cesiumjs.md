# ADR-0012 — Adopt CesiumJS for 3D geospatial visualization

Status: Proposed
Owner: Eco Nojin

## Context
Need 3D globe/terrain visualization without API keys or paid services.

## Decision
Adopt CesiumJS for 3D geospatial views in Eco Nojin.

## Consequences
- Apache-2.0 license.
- No API key required for core library.
- Integration via `packages/spatial` and platform map components.
- No operational cost.

## Risks
- Large bundle; requires lazy loading.
- Ion assets may require account for premium data.
# ADR-0004 — Map base: MapLibre GL JS 2D + deck.gl (client-only)

- **Status:** ACCEPTED
- **Date:** 2026-11-22
- **Deciders:** owner (via resident agent)
- **Related:** Phase 1 of apps evolution plan

## Context
HyDroMA needs 2D geospatial rendering across scientific-workspace and platform.
Upstream candidates: MapLibre GL JS, deck.gl, Cesium, Giro3D. Requirement: free (no licence cost) and no extra server load (client-side rendering only).

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|
| MapLibre 2D + deck.gl | Free (BSD-3/MIT), client-only, proven in 6 upstream projects | Large bundle | Medium |
| + Giro3D (3D) | 3D capability | Extra bundle, three.js | Medium |
| + Cesium (3D) | Rich 3D | Ion token / heavier, larger | High |

## Decision
MapLibre GL JS as the 2D standard; deck.gl for heavy data layers; 3D (Giro3D or Cesium) deferred behind a feature flag and only if a real 3D need is validated. All rendering is client-side; no tile/map server added.

## Consequences
- Positive: free, no server load, consistent with existing packages/spatial.
- Negative: bundle size budget required; 3D not available initially.
- Follow-up work: packages/spatial layer contract; code-splitting + lazy map components.
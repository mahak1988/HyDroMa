# @eco-nojin/spatial — Layer contract & map base

**Map base decision:** MapLibre GL JS 2D + deck.gl (client-only, free, no server load). See ADR-0004.

## Layer contract
Every map layer is a `LayerDescriptor` (id, kind, visible, opacity, legend, provenance, owner).
- `validateLayerDescriptor` guards at registration time (no opaque MapLibre errors).
- `createLayerRegistry` stores intent; `onLayerChange` is where the engine is updated.
- `removeByOwner` lets a feature remove only its own layers (plugin safety).
- `LayerProvenance` is mandatory for scientific layers (source, sourceKind, license, model version, caveat).

## Kinds
`raster, vector, point, line, polygon, heatmap, hexagon, scatter, boundary, graticule`

## deck.gl integration (planned, Phase 1)
deck.gl layers will be adapted to `LayerDescriptor` via a converter in `./deck.ts` (not yet implemented). Requires adding `@deck.gl/*` to dependencies and a feature flag. No server-side tile service is added.

## RTL
Map controls respect document direction via `DirectionProvider` (packages/i18n). Use `mirrorClass` for control placement.
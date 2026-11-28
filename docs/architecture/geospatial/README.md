# Geospatial Architecture (branch index)

**Status:** SCAFFOLDED. No GIS data migrated, no spatial service installed. Authoritative depth:
`architecture/LANDSCAPE-MANAGEMENT-ARCHITECTURE.md`, `architecture/LANDSCAPE-DOMAIN-MODEL.md`,
`architecture/LANDSCAPE-API-CONTRACTS.md`, module catalog (GIS-*).

## Target

Spatial data model · CRS declared · spatial API · spatial DB (PostGIS) · vector/raster · COG · STAC ·
GeoJSON · spatial queries/indexes · raster/vector processing · spatial metadata · provenance · map
rendering · geospatial APIs.

## Spatial entities

Territories · villages · farms · rangelands · watersheds · projects · ecosystems · restoration sites ·
tourism locations · environmental monitoring.

## Future integration points

MapLibre · deck.gl · PostGIS · STAC · COG · TiTiler (options, not installed). 3D (Cesium/Three.js)
only with an approved use case (D-HYDROMA-06).

## Current state

`packages/spatial` (client helpers) + engine `spatial.py`/STAC (software-tested). No spatial DB, no
tile service, no migrated GIS data.

## Related

- [../component-registry.md](../component-registry.md) · D-HYDROMA-05/06
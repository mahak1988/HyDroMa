# BATCH 04 — VISUALIZATION — SOURCE AUDIT
## Cesium, deck.gl, MapLibre GL JS

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level analysis. No build, no run.

---

## 1. CESIUM (`cesium-1.147.zip`, 80 MB, Apache-2.0)
- **Architecture:** `Source/` (JS+TS), `Specs/` (tests), `packages/` (engine, widgets). CesiumJS engine + widgets.
- **Core source:** 2,900 source files; 41 test files (Specs).
- **Main interfaces:** `Cesium.Viewer`, `Cesium3DTileset`, `Entity`, `DataSource`.
- **Capabilities (source-verified):** 3D globe, terrain, 3D Tiles, imagery, GeoJSON, CZML, entities.
- **Proven:** source present; NOT built in this audit.
- **Runtime:** WebGL2; browser. Optional Cesium ion (paid, separate terms).
- **License:** Apache-2.0. **Cesium ion = separate commercial terms.**
- **Eco Nojin modules:** `GIS-GLOBE3D`, `GIS-TERRAIN`.
- **Mapping:** `DIRECT_REUSE` (code) / ion optional.
- **Risks:** heavy; ion lock-in if used; Apache NOTICE propagation.

## 2. DECK.GL (`deck.gl-9.4.0.zip`, 71 MB, MIT)
- **Architecture:** `modules/` (JS+TS), `test/` (945 tests), `examples/`. Monorepo (lerna).
- **Core source:** 753 source files; 945 test files.
- **Main interfaces:** `DeckGL`, `Layer` classes, `Deck` API.
- **Capabilities:** WebGL layer rendering (scatterplot, arc, heatmap, hexagon, GeoJson, Tile3DLayer, etc.).
- **Proven:** source present; NOT built.
- **Runtime:** WebGL; browser. GPU required for large datasets.
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `GIS-VECTOR`, `GIS-RASTER` (layers).
- **Mapping:** `DIRECT_REUSE`.
- **Risks:** GPU capability required; complements MapLibre.

## 3. MAPLIBRE GL JS (`maplibre-gl-js-main.zip`, 174 MB, BSD-3-Clause)
- **Architecture:** `src/` (TS), `test/` (5,035 tests), `build/`, `docs/`. WebGL maps.
- **Core source:** 360 source files; 5,035 test files.
- **Main interfaces:** `Map`, `Style`, `Source`, `Layer`, `Marker`, `Popup`.
- **Capabilities:** 2D vector/raster maps, terrain (raster-dem), 3D (fill-extrusion), GeoJSON, COG.
- **Proven:** source present; NOT built in this audit (but used in PoC earlier — MapLibre GL 6.16 rendered successfully in headless Chrome).
- **Runtime:** WebGL; browser. Tile providers external.
- **License:** BSD-3-Clause. Permissive.
- **Eco Nojin modules:** `GIS-MAP2D`, `GIS-TERRAIN`.
- **Mapping:** `DIRECT_REUSE`.
- **Risks:** branch archive (main, not a release); map data/tiles separate licenses.

---

## 4. BATCH SUMMARY
- 3 projects, all `EXTRACTED`, all permissive (Apache/MIT/BSD).
- **Overlap:** maplibre (2D) + cesium (3D globe) + deck.gl (layers) are **complementary**, not exclusive.
- **Proven rendering:** MapLibre GL was verified rendering in a headless Chrome PoC earlier (v6.16); Cesium/deck.gl source-verified only.
- **No project approved.**
# @eco-nojin/spatial

Shared spatial infrastructure for Eco Nojin apps.

## Responsibility

This package owns the **client-side map runtime**:

- MapLibre GL JS engine and stylesheet.
- Offline basemap style helpers (no tile provider, no network).
- Design-token colour resolution (MapLibre needs concrete colours, not CSS variables).
- Worker lifecycle (`maplibre-gl-worker.mjs` is bundled as a Vite asset).
- Map lifecycle: controls, resize handling, RTL/LTR metadata, cleanup.

It does **not** own:

- Application layers (science indicators, tourism zones/routes).
- Geographic data or domain types.
- Tile services, routing engines or STAC clients.

Application-specific layers stay in the app:
`apps/scientific-workspace/src/components/ScienceMap.tsx` and
`apps/tourism/src/components/TourismMap.tsx`.

## Upstream provenance

| Asset | Version | Source | Licence |
|---|---|---|---|
| `maplibre-gl` | 6.19.0 (installed) / 6.18.0 (registry snapshot) | `upstream-registry/maplibre-gl-js`, `upstream-archives/batch-04-visualization/maplibre-gl-js-main.zip` | BSD-3-Clause |
| `maplibre-gl-worker.mjs` | 6.19.0 | `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` (unmodified) | BSD-3-Clause |

Copyright (c) 2023, MapLibre contributors. Full text: `NOTICE.md`.

The worker is an unmodified build artefact. It is not authored source and must be replaced
together with the `maplibre-gl` version when the dependency is upgraded.

## Usage

```ts
import {
  mountSpatialMap,
  createBaseStyle,
  addGraticule,
  addBbox,
  resolveMapColors,
} from "@eco-nojin/spatial";

const colors = resolveMapColors();
const style = createBaseStyle(colors);
addGraticule(style, bbox, colors);
addBbox(style, bbox, colors);

const controller = mountSpatialMap({
  container,
  style,
  center: [51.05, 36.08],
  zoom: 8.2,
  ariaLabel: "Tourism map",
});

controller.map.on("load", () => {
  // add app-specific sources and layers here
});

// on unmount
controller.destroy();
```

## Boundaries

- Depends only on third-party packages (`maplibre-gl`, `@types/geojson`).
- Must not import from `apps/*`, `engines/*`, `services/*`, `contracts/*` or `upstream-*`.
- Apps depend on this package; this package never depends on an app.

## Status

`IMPLEMENTED` — shared runtime adopted by HyDroMA and Tourism.
No tile provider, routing service or 3D engine is connected.
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import type { MapColors } from "./colors";

export type LngLat = [number, number];
export type BBox = [number, number, number, number];

/** A generated graticule so the map is usable without a tile provider. */
export function graticule(bbox: BBox, divisions = 6): FeatureCollection {
  const [minX, minY, maxX, maxY] = bbox;
  const features: Array<Feature<LineString>> = [];
  for (let index = 0; index <= divisions; index += 1) {
    const x = minX + ((maxX - minX) * index) / divisions;
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[x, minY], [x, maxY]] },
    });
    const y = minY + ((maxY - minY) * index) / divisions;
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [[minX, y], [maxX, y]] },
    });
  }
  return { type: "FeatureCollection", features };
}

/** A closed rectangle polygon for a study area or a generalized boundary. */
export function bboxPolygon(bbox: BBox): FeatureCollection {
  const [minX, minY, maxX, maxY] = bbox;
  const ring: LngLat[] = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
    [minX, minY],
  ];
  const feature: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
  return { type: "FeatureCollection", features: [feature] };
}

/** Base offline style: a background layer only. Apps add their own sources. */
export function createBaseStyle(colors: MapColors): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": colors.canvas } }],
  };
}

/** Add the offline graticule source and line layer to a style. */
export function addGraticule(style: StyleSpecification, bbox: BBox, colors: MapColors, sourceId = "graticule"): void {
  style.sources[sourceId] = { type: "geojson", data: graticule(bbox) };
  style.layers.push({
    id: sourceId,
    type: "line",
    source: sourceId,
    paint: { "line-color": colors.grid, "line-width": 0.8, "line-opacity": 0.55 },
  });
}

/** Add a generalized area fill and outline to a style. */
export function addBbox(style: StyleSpecification, bbox: BBox, colors: MapColors, sourceId = "study-area"): void {
  style.sources[sourceId] = { type: "geojson", data: bboxPolygon(bbox) };
  style.layers.push({
    id: `${sourceId}-fill`,
    type: "fill",
    source: sourceId,
    paint: { "fill-color": colors.primary, "fill-opacity": 0.07 },
  });
  style.layers.push({
    id: `${sourceId}-outline`,
    type: "line",
    source: sourceId,
    paint: { "line-color": colors.primary, "line-width": 1.8, "line-opacity": 0.9 },
  });
}
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "geojson";
import type { StudyArea } from "../data/indicators";

export type MapLayers = { stations: boolean; vegetation: boolean; boundary: boolean };
export type SelectedFeature = { kind: "station" | "vegetation"; label: string; value: string } | null;

function cssTokens() {
  const styles = getComputedStyle(document.documentElement);
  return {
    background: styles.getPropertyValue("--canvas").trim() || "#f6f8f6",
    grid: styles.getPropertyValue("--border-strong").trim() || "#c7d4cc",
    area: styles.getPropertyValue("--primary").trim() || "#0f6b4f",
  };
}

function graticule(bbox: [number, number, number, number]): FeatureCollection {
  const [minX, minY, maxX, maxY] = bbox;
  const features = [];
  for (let i = 0; i <= 6; i += 1) {
    const x = minX + ((maxX - minX) * i) / 6;
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[x, minY], [x, maxY]] } });
    const y = minY + ((maxY - minY) * i) / 6;
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[minX, y], [maxX, y]] } });
  }
  return { type: "FeatureCollection", features } as FeatureCollection;
}

function areaPolygon(bbox: [number, number, number, number]): FeatureCollection {
  const [minX, minY, maxX, maxY] = bbox;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { kind: "study-area" },
        geometry: { type: "Polygon", coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] },
      },
    ],
  } as FeatureCollection;
}

function stations(area: StudyArea) {
  const [minX, minY, maxX, maxY] = area.bbox;
  return Array.from({ length: 14 }, (_, index) => {
    const fx = ((index * 37) % 100) / 100;
    const fy = ((index * 61) % 100) / 100;
    return {
      position: [minX + (maxX - minX) * fx, minY + (maxY - minY) * fy] as [number, number],
      name: `ST-${String(index + 1).padStart(2, "0")}`,
    };
  });
}

function vegetationPoints(area: StudyArea) {
  const [minX, minY, maxX, maxY] = area.bbox;
  return Array.from({ length: 260 }, (_, index) => {
    const fx = ((index * 47) % 997) / 997;
    const fy = ((index * 83) % 991) / 991;
    return { position: [minX + (maxX - minX) * fx, minY + (maxY - minY) * fy] as [number, number] };
  });
}

let workerConfigured = false;

export function ScienceMap({
  area,
  layers,
  onSelect,
  className,
}: {
  area: StudyArea;
  layers: MapLayers;
  onSelect?: (feature: SelectedFeature) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!container.current) return;
    if (!workerConfigured) {
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      workerConfigured = true;
    }
    const colors = cssTokens();
    const map = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          grid: { type: "geojson", data: graticule(area.bbox) },
          area: { type: "geojson", data: areaPolygon(area.bbox) },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": colors.background } },
          { id: "grid", type: "line", source: "grid", paint: { "line-color": colors.grid, "line-width": 0.8, "line-opacity": 0.55 } },
          {
            id: "area",
            type: "fill",
            source: "area",
            paint: { "fill-color": colors.area, "fill-opacity": 0.07 },
          },
          {
            id: "area-outline",
            type: "line",
            source: "area",
            paint: { "line-color": colors.area, "line-width": 1.8, "line-opacity": 0.9 },
          },
        ],
      },
      center: area.center,
      zoom: 9.4,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    const deckLayers: Layer[] = [];
    if (layers.vegetation) {
      deckLayers.push(
        new HexagonLayer({
          id: "vegetation-density",
          data: vegetationPoints(area),
          getPosition: (point: { position: [number, number] }) => point.position,
          radius: 1400,
          coverage: 0.8,
          extruded: false,
          opacity: 0.55,
          colorRange: [
            [234, 246, 241],
            [134, 202, 180],
            [52, 160, 129],
            [15, 107, 79],
            [11, 74, 52],
          ],
          pickable: true,
          onClick: () => {
            onSelect?.({ kind: "vegetation", label: "NDVI density cell", value: "0.42 ± 0.05 (demo)" });
            return true;
          },
        }),
      );
    }
    if (layers.stations) {
      deckLayers.push(
        new ScatterplotLayer<{ position: [number, number]; name: string }>({
          id: "monitoring-stations",
          data: stations(area),
          getPosition: (point) => point.position,
          getRadius: 420,
          radiusUnits: "meters",
          getFillColor: [14, 116, 144, 220],
          stroked: true,
          getLineColor: [255, 255, 255, 180],
          lineWidthUnits: "pixels",
          getLineWidth: 1,
          pickable: true,
          onClick: (info) => {
            onSelect?.({
              kind: "station",
              label: info.object?.name ?? "Station",
              value: "Precipitation 28.4 mm · quality: medium (demo)",
            });
            return true;
          },
        }),
      );
    }

    const overlay = new MapboxOverlay({ interleaved: false, layers: deckLayers });
    map.addControl(overlay as unknown as maplibregl.IControl);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [area, layers, onSelect]);

  return <div ref={container} className={className ?? "h-[420px] w-full"} role="application" aria-label="Landscape map" />;
}
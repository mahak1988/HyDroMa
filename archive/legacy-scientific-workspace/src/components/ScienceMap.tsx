import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import {
  AreaPriorityLimiter,
  addBbox,
  addGraticule,
  buildLegendItems,
  createLayerRegistry,
  createBaseStyle,
  legendSwatchStyle,
  mountSpatialMap,
  resolveMapColors,
  sampleGridPoints,
  type IControl,
  type LayerDescriptor,
  type SpatialMap,
} from "@eco-nojin/spatial";
import type { StudyArea } from "../data/indicators";

export type MapLayers = { stations: boolean; vegetation: boolean; boundary: boolean };
export type SelectedFeature = { kind: "station" | "vegetation"; label: string; value: string } | null;

/**
 * Layer descriptors are the contract between the UI and the map. Declaring them
 * (instead of building layers inline) means the legend, the toggles and the
 * provenance panel all read the same list — they cannot disagree with the map.
 */
const VEGETATION_COLOR = "var(--success)";
const STATION_COLOR = "var(--service-hydroma)";

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
  return sampleGridPoints([minX, minY, maxX, maxY], 260).map((position) => ({ position }));
}

function describeLayers(): LayerDescriptor[] {
  return [
    {
      id: "vegetation-density",
      label: "Vegetation density",
      kind: "hexagon",
      visible: true,
      opacity: 0.55,
      legend: { label: "Vegetation density (NDVI)", color: VEGETATION_COLOR, shape: "fill" },
      provenance: {
        source: "demo-indicator-grid",
        sourceKind: "synthetic",
        license: "demo-data",
        model: { id: "ndvi-hex", version: "0.1.0" },
        caveat: "Synthetic demonstration grid. Not a measurement.",
      },
      owner: "scientific-workspace",
    },
    {
      id: "monitoring-stations",
      label: "Monitoring stations",
      kind: "scatter",
      visible: true,
      legend: { label: "Monitoring station", color: STATION_COLOR, shape: "circle" },
      provenance: {
        source: "demo-station-registry",
        sourceKind: "synthetic",
        license: "demo-data",
        model: { id: "station-registry", version: "0.1.0" },
      },
      owner: "scientific-workspace",
    },
  ];
}

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
  const mapRef = useRef<SpatialMap | null>(null);
  const { locale, t } = useI18n();

  // Registry drives both the map and the legend; `onLayerChange` is where the
  // engine would be touched (MapLibre source/visibility), never in the UI.
  const registry = useMemo(() => createLayerRegistry(), []);

  const descriptors = useMemo(() => {
    const all = describeLayers();
    registry.registerAll(all);
    return all;
  }, [registry]);

  useEffect(() => {
    registry.setVisible("vegetation-density", layers.vegetation);
    registry.setVisible("monitoring-stations", layers.stations);
  }, [layers.boundary, layers.stations, layers.vegetation, registry]);

  const legend = useMemo(() => buildLegendItems(descriptors), [descriptors]);

  useEffect(() => {
    if (!container.current) return;

    const colors = resolveMapColors();
    const style = createBaseStyle(colors);
    addGraticule(style, area.bbox, colors, "grid");
    if (layers.boundary) addBbox(style, area.bbox, colors, "area");

    const controller = mountSpatialMap({
      container: container.current,
      style,
      center: area.center,
      zoom: 9.4,
      ariaLabel: "Landscape map",
    });
    const map = controller.map;

    // Viewport limiter: dense grids are capped by area so pan/zoom stays smooth,
    // and the cap is reported rather than hidden.
    const limiter = new AreaPriorityLimiter(1_200);

    const deckLayers: Layer[] = [];
    if (layers.vegetation) {
      const capped = limiter.limit(
        vegetationPoints(area),
        area.bbox,
        () => 1,
        () => area.bbox,
      );
      deckLayers.push(
        new HexagonLayer({
          id: "vegetation-density",
          data: capped.features,
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
    map.addControl(overlay as unknown as IControl);
    mapRef.current = map;

    return () => {
      controller.destroy();
      mapRef.current = null;
    };
  }, [area, layers.boundary, layers.stations, layers.vegetation, onSelect]);

  // Keep direction in sync when the active locale changes, without remounting.
  useEffect(() => {
    const dir = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
    container.current?.setAttribute("dir", dir);
    const canvas = mapRef.current?.getCanvas();
    canvas?.setAttribute("dir", dir);
  }, [locale]);

  return (
    <div className={className ?? "h-[420px] w-full"}>
      <div ref={container} className="h-full w-full" role="application" aria-label="Landscape map" />
      <ul className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-fg-muted" aria-label={t("hydro.map.legend")}>
        {legend.map((entry) => (
          <li key={entry.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" style={legendSwatchStyle(entry)} />
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
import { Map, NavigationControl, ScaleControl } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import type { LngLat } from "./style";
import { configureSpatialWorker } from "./worker";

export type SpatialMap = Map;

export type MountSpatialMapOptions = {
  container: HTMLElement;
  style: StyleSpecification;
  center: LngLat;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  ariaLabel?: string;
  dir?: "rtl" | "ltr";
  onReady?: (map: SpatialMap) => void;
};

export type SpatialController = {
  map: SpatialMap;
  destroy: () => void;
};

function resolveDirection(explicit?: "rtl" | "ltr"): "rtl" | "ltr" {
  if (explicit) return explicit;
  if (typeof document !== "undefined" && document.documentElement.dir === "rtl") return "rtl";
  return "ltr";
}

/**
 * Create a MapLibre map with the shared offline lifecycle:
 * worker setup, standard controls, resize handling, direction metadata and
 * deterministic cleanup.
 */
export function mountSpatialMap(options: MountSpatialMapOptions): SpatialController {
  configureSpatialWorker();

  const dir = resolveDirection(options.dir);
  const { container } = options;
  container.setAttribute("dir", dir);

  const map = new Map({
    container,
    style: options.style,
    center: options.center,
    zoom: options.zoom ?? 8,
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    attributionControl: false,
  });

  map.addControl(new NavigationControl({ showCompass: false }), "top-right");
  map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

  const canvas = map.getCanvas();
  canvas.setAttribute("dir", dir);
  if (options.ariaLabel) {
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", options.ariaLabel);
  }

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => map.resize());
  observer?.observe(container);

  const onLoad = () => {
    map.resize();
    options.onReady?.(map);
  };
  map.on("load", onLoad);

  let destroyed = false;
  return {
    map,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      map.off("load", onLoad);
      map.remove();
    },
  };
}
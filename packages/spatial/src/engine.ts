import type { SpatialLayerKind } from "./layer";

/**
 * Spatial engine abstraction.
 *
 * Today Eco Nojin ships one engine (MapLibre). The interface exists so that
 * consumers stop depending on a concrete `Map` instance: they ask for
 * capabilities and layer-kind support instead of assuming MapLibre semantics.
 * Adding a second engine then touches one file, not every map component.
 */
export type SpatialEngineKind = "maplibre" | "mapbox" | "cesium" | "arcgis";

export const SPATIAL_ENGINE_KINDS: readonly SpatialEngineKind[] = ["maplibre", "mapbox", "cesium", "arcgis"];

/** Frozen capability flags — UI gates on these, never on `kind`. */
export type SpatialCapabilities = {
  /** Vector/raster style spec editing. */
  styleSpec: boolean;
  /** A live map instance is reachable (for escape hatches and tests). */
  nativeMapInstance: boolean;
  /** deck.gl overlay interop. */
  deckOverlay: boolean;
  /** 3D terrain. */
  terrain: boolean;
  /** Feature picking / click queries. */
  picking: boolean;
  /** Custom layer objects can be added at runtime. */
  customLayers: boolean;
  /** A legend can be derived from layer symbology. */
  legend: boolean;
  /** Graticule and graticule-style offline fallback. */
  offlineFallback: boolean;
  supportedLayerKinds: readonly SpatialLayerKind[];
};

export type SpatialEngine<TMap = unknown> = {
  kind: SpatialEngineKind;
  capabilities: SpatialCapabilities;
  getMap(): TMap | null;
  isLayerKindSupported: (kind: SpatialLayerKind) => boolean;
};

const ALL_KINDS: readonly SpatialLayerKind[] = [
  "raster",
  "vector",
  "point",
  "line",
  "polygon",
  "heatmap",
  "hexagon",
  "scatter",
  "boundary",
  "graticule",
];

const MAPLIBRE_CAPABILITIES: SpatialCapabilities = {
  styleSpec: true,
  nativeMapInstance: true,
  deckOverlay: true,
  terrain: false,
  picking: true,
  customLayers: true,
  legend: true,
  offlineFallback: true,
  supportedLayerKinds: ALL_KINDS,
};

const CESIUM_CAPABILITIES: SpatialCapabilities = {
  styleSpec: false,
  nativeMapInstance: true,
  deckOverlay: false,
  terrain: true,
  picking: true,
  customLayers: false,
  legend: true,
  offlineFallback: false,
  supportedLayerKinds: ["raster", "vector", "point", "line", "polygon", "boundary"],
};

const MAPBOX_CAPABILITIES: SpatialCapabilities = {
  ...MAPLIBRE_CAPABILITIES,
  terrain: true,
};

const ARCGIS_CAPABILITIES: SpatialCapabilities = {
  ...MAPLIBRE_CAPABILITIES,
  styleSpec: false,
  deckOverlay: true,
  terrain: true,
};

export const CAPABILITIES_BY_KIND: Readonly<Record<SpatialEngineKind, SpatialCapabilities>> = {
  maplibre: MAPLIBRE_CAPABILITIES,
  mapbox: MAPBOX_CAPABILITIES,
  cesium: CESIUM_CAPABILITIES,
  arcgis: ARCGIS_CAPABILITIES,
};

export function capabilitiesFor(kind: SpatialEngineKind): SpatialCapabilities {
  return CAPABILITIES_BY_KIND[kind] ?? MAPLIBRE_CAPABILITIES;
}

export function supportsLayerKind(capabilities: SpatialCapabilities, kind: SpatialLayerKind): boolean {
  return capabilities.supportedLayerKinds.includes(kind);
}

/** Build an engine descriptor around an already-mounted map instance. */
export function createSpatialEngine<TMap>(kind: SpatialEngineKind, getMap: () => TMap | null): SpatialEngine<TMap> {
  const capabilities = capabilitiesFor(kind);
  return {
    kind,
    capabilities,
    getMap,
    isLayerKindSupported: (layerKind) => supportsLayerKind(capabilities, layerKind),
  };
}

export const DEFAULT_SPATIAL_ENGINE: SpatialEngineKind = "maplibre";
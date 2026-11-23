import "maplibre-gl/dist/maplibre-gl.css";

export { Map, NavigationControl, Popup, ScaleControl, setWorkerCount, setWorkerUrl } from "maplibre-gl";
export type { IControl, Map as SpatialMap, MapLayerMouseEvent } from "maplibre-gl";
export type { Feature, FeatureCollection, Geometry } from "geojson";

export { resolveMapColors } from "./colors";
export type { MapColors } from "./colors";

export { addBbox, addGraticule, bboxPolygon, createBaseStyle, graticule } from "./style";
export type { BBox, LngLat } from "./style";

export { mountSpatialMap } from "./map";
export type { MountSpatialMapOptions, SpatialController } from "./map";

export { configureSpatialWorker, spatialWorkerUrl } from "./worker";

export {
  CAPABILITIES_BY_KIND,
  DEFAULT_SPATIAL_ENGINE,
  SPATIAL_ENGINE_KINDS,
  capabilitiesFor,
  createSpatialEngine,
  supportsLayerKind,
  type SpatialCapabilities,
  type SpatialEngine,
  type SpatialEngineKind,
} from "./engine";

export {
  SPATIAL_LAYER_KINDS,
  buildLegend,
  createLayerRegistry,
  formatLayerErrors,
  sampleGridPoints,
  validateLayerDescriptor,
  type LayerDescriptor,
  type LayerDescriptorErrors,
  type LayerLegend,
  type LayerProvenance,
  type LayerRegistry,
  type LayerRegistryOptions,
  type LayerValidation,
  type LegendEntry,
  type SpatialLayerKind,
} from "./layer";

export { AreaPriorityLimiter, bboxAreaHa, limitByDistance, polygonAreaHa, type LimitedFeature, type LimiterStats } from "./limiter";

export { buildLegendItems, groupLegendByKind, legendSwatchStyle, type LegendItem } from "./legend";
export { DECK_LAYER_BY_KIND, createDeckLayer, deckPropsFromDescriptor, resolveDeckLayerClass } from "./deck";
export type { DeckLayerFactory, DeckLayerInput } from "./deck";
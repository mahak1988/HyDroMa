import type { LayerDescriptor, SpatialLayerKind } from "./layer";

/**
 * deck.gl adapter (Phase 1).
 *
 * Converts a `LayerDescriptor` into a deck.gl layer factory. The adapter is
 * deliberately thin: it maps spatial kinds to deck.gl layer classes and
 * forwards provenance/opacity/visibility. Data and accessors are supplied by
 * the caller so the descriptor stays data-free (auditable).
 *
 * deck.gl is an optional rendering backend; MapLibre remains the default.
 */
export type DeckLayerInput = {
  descriptor: LayerDescriptor;
  /** Source data for the layer (GeoJSON, array of points, etc.). */
  data: unknown;
  /** Extra deck.gl props merged after the descriptor-derived ones. */
  props?: Record<string, unknown>;
};

export type DeckLayerFactory = (input: DeckLayerInput) => unknown;

/** Maps spatial kinds to deck.gl layer class names (resolved at runtime). */
export const DECK_LAYER_BY_KIND: Record<SpatialLayerKind, string> = {
  raster: "BitmapLayer",
  vector: "GeoJsonLayer",
  point: "ScatterplotLayer",
  line: "PathLayer",
  polygon: "PolygonLayer",
  heatmap: "HeatmapLayer",
  hexagon: "HexagonLayer",
  scatter: "ScatterplotLayer",
  boundary: "GeoJsonLayer",
  graticule: "PathLayer",
  extrusion: "SolidPolygonLayer",
};

/**
 * Build the common deck.gl props derived from a descriptor. Kept separate so
 * tests can assert the mapping without instantiating deck.gl.
 */
export function deckPropsFromDescriptor(descriptor: LayerDescriptor): Record<string, unknown> {
  return {
    id: descriptor.id,
    opacity: descriptor.opacity ?? 1,
    visible: descriptor.visible,
    pickable: true,
  };
}

/**
 * Resolve a deck.gl layer class by name from the deck.gl modules. Returns
 * null when the class is not available (e.g. tree-shaken), so callers can
 * fall back to MapLibre.
 */
export async function resolveDeckLayerClass(name: string): Promise<(new (...args: unknown[]) => unknown) | null> {
  try {
    const layers = await import("@deck.gl/layers");
    const agg = await import("@deck.gl/aggregation-layers");
    const map = { ...layers, ...agg } as Record<string, unknown>;
    const ctor = map[name];
    return typeof ctor === "function" ? (ctor as new (...args: unknown[]) => unknown) : null;
  } catch {
    return null;
  }
}

/**
 * Create a deck.gl layer instance from a descriptor. Returns null if the
 * required deck.gl class cannot be resolved; callers fall back to MapLibre.
 */
export async function createDeckLayer(input: DeckLayerInput): Promise<unknown | null> {
  const name = DECK_LAYER_BY_KIND[input.descriptor.kind];
  const Ctor = await resolveDeckLayerClass(name);
  if (!Ctor) return null;
  return new Ctor({ ...deckPropsFromDescriptor(input.descriptor), data: input.data, ...input.props });
}
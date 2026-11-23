import { Registry } from "@eco-nojin/domain-types";

/**
 * Layer descriptors — the metadata model every map layer carries.
 *
 * A layer is data, not a component: id, kind, visibility, opacity, provenance
 * and a legend entry. This is what makes a map auditable ("where did this layer
 * come from, which model version, what licence") and what lets the same layer
 * list drive both the map and its legend.
 */
export const SPATIAL_LAYER_KINDS = [
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
  "extrusion",
] as const;

export type SpatialLayerKind = (typeof SPATIAL_LAYER_KINDS)[number];

/** Provenance is mandatory for scientific layers, optional for basemaps. */
export type LayerProvenance = {
  source: string;
  sourceKind: string;
  license?: string;
  updatedAt?: string;
  model?: { id: string; version: string };
  /** Free-form note about what the layer does *not* claim. */
  caveat?: string;
};

export type LayerLegend = {
  label: string;
  color?: string;
  shape?: "circle" | "line" | "fill";
};

export type LayerDescriptor = {
  id: string;
  label: string;
  kind: SpatialLayerKind;
  visible: boolean;
  opacity?: number;
  legend?: LayerLegend;
  provenance?: LayerProvenance;
  /** Owner id (plugin/app) so a feature can remove only its own layers. */
  owner?: string;
};

export type LayerRegistryOptions = {
  /** Called when a layer is toggled; the app applies it to the engine. */
  onLayerChange?: (layer: LayerDescriptor) => void;
  /** What to do when a descriptor fails runtime validation. */
  onInvalid?: "throw" | "skip";
};

export type LayerDescriptorErrors = Record<string, string>;

export type LayerValidation =
  | { ok: true; value: LayerDescriptor }
  | { ok: false; errors: LayerDescriptorErrors };

const LEGEND_SHAPES: ReadonlyArray<string> = ["circle", "line", "fill"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Runtime validation for a layer descriptor.
 *
 * `LayerDescriptor` is a TypeScript type, which means a malformed value coming
 * from a plugin, an API or persisted state would otherwise reach the engine and
 * fail as an opaque MapLibre error (or silently paint `NaN` opacity). This guard
 * turns that into a named, field-level error at registration time.
 */
export function validateLayerDescriptor(input: unknown): LayerValidation {
  if (!isRecord(input)) {
    return { ok: false, errors: { _form: "layer descriptor must be an object" } };
  }

  const errors: LayerDescriptorErrors = {};

  if (!isNonEmptyString(input.id)) errors.id = "id is required";
  if (!isNonEmptyString(input.label)) errors.label = "label is required";
  if (!isNonEmptyString(input.kind) || !SPATIAL_LAYER_KINDS.includes(input.kind as SpatialLayerKind)) {
    errors.kind = `kind must be one of ${SPATIAL_LAYER_KINDS.join(", ")}`;
  }
  if (typeof input.visible !== "boolean") errors.visible = "visible must be a boolean";

  if (input.opacity !== undefined) {
    if (typeof input.opacity !== "number" || !Number.isFinite(input.opacity) || input.opacity < 0 || input.opacity > 1) {
      errors.opacity = "opacity must be a number between 0 and 1";
    }
  }

  if (input.legend !== undefined) {
    if (!isRecord(input.legend)) {
      errors.legend = "legend must be an object";
    } else {
      const legend = input.legend;
      if (!isNonEmptyString(legend.label)) errors.legend = "legend.label is required";
      if (legend.shape !== undefined && !LEGEND_SHAPES.includes(String(legend.shape))) {
        errors.legend = `legend.shape must be one of ${LEGEND_SHAPES.join(", ")}`;
      }
    }
  }

  if (input.provenance !== undefined) {
    if (!isRecord(input.provenance)) {
      errors.provenance = "provenance must be an object";
    } else {
      const provenance = input.provenance;
      if (!isNonEmptyString(provenance.source)) errors.provenance = "provenance.source is required";
      if (!isNonEmptyString(provenance.sourceKind)) errors.provenance = "provenance.sourceKind is required";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as LayerDescriptor };
}

export function formatLayerErrors(errors: LayerDescriptorErrors): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join("; ");
}

export type LayerRegistry = {
  register: (layer: LayerDescriptor) => LayerDescriptor;
  registerAll: (layers: readonly LayerDescriptor[]) => void;
  get: (id: string) => LayerDescriptor | undefined;
  list: () => LayerDescriptor[];
  setVisible: (id: string, visible: boolean) => void;
  setOpacity: (id: string, opacity: number) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  removeByOwner: (owner: string) => number;
  clear: () => void;
};

/**
 * A layer registry backed by `Registry<LayerDescriptor>`.
 *
 * Mutation is deliberately explicit: the registry stores intent, and
 * `onLayerChange` is where the engine (MapLibre style/source/visibility) is
 * actually updated. Keeping the two apart means the UI never talks to MapLibre.
 */
export function createLayerRegistry(options: LayerRegistryOptions = {}): LayerRegistry {
  const registry = new Registry<LayerDescriptor>({ onDuplicate: "replace", name: "layer" });
  const onInvalid = options.onInvalid ?? "throw";

  const emit = (layer: LayerDescriptor) => options.onLayerChange?.(layer);

  const accept = (layer: LayerDescriptor): LayerDescriptor | null => {
    const result = validateLayerDescriptor(layer);
    if (!result.ok) {
      const message = `Invalid layer descriptor "${String((layer as { id?: unknown })?.id)}": ${formatLayerErrors(result.errors)}`;
      if (onInvalid === "throw") throw new Error(message);
      console.warn(message);
      return null;
    }
    return result.value;
  };

  const update = (id: string, patch: Partial<LayerDescriptor>) => {
    const current = registry.get(id);
    if (!current) return;
    const next = accept({ ...current, ...patch });
    if (!next) return;
    registry.registerValue(id, next);
    emit(next);
  };

  return {
    register: (layer) => {
      const accepted = accept(layer);
      if (accepted) registry.registerValue(accepted.id, accepted);
      return accepted ?? layer;
    },
    registerAll: (layers) => {
      for (const layer of layers) {
        const accepted = accept(layer);
        if (accepted) registry.registerValue(accepted.id, accepted);
      }
    },
    get: (id) => registry.get(id),
    list: () => registry.list(),
    setVisible: (id, visible) => update(id, { visible }),
    setOpacity: (id, opacity) => {
      // A non-finite opacity is a programming error (a slider can transiently
      // produce NaN); reject it loudly rather than storing NaN into the engine.
      if (typeof opacity !== "number" || !Number.isFinite(opacity)) {
        throw new Error(`setOpacity("${id}") requires a finite number, received ${String(opacity)}`);
      }
      update(id, { opacity: Math.min(1, Math.max(0, opacity)) });
    },
    toggle: (id) => {
      const current = registry.get(id);
      if (current) update(id, { visible: !current.visible });
    },
    remove: (id) => {
      registry.unregister(id);
    },
    removeByOwner: (owner) =>
      registry.unregisterByOwner(owner, (layer) => layer.owner ?? ""),
    clear: () => registry.clear(),
  };
}

/** Legend entries derived from visible layers that declare one. */
export type LegendEntry = LayerLegend & { id: string };

export function buildLegend(layers: readonly LayerDescriptor[]): LegendEntry[] {
  const entries: LegendEntry[] = [];
  for (const layer of layers) {
    if (!layer.visible || !layer.legend) continue;
    entries.push({ id: layer.id, ...layer.legend });
  }
  return entries;
}

/**
 * Deterministic sample data for a bounding box. Used by demos and by tests so a
 * layer can be rendered without a tile provider.
 */
export function sampleGridPoints(
  bbox: readonly [number, number, number, number],
  count: number,
): Array<[number, number]> {
  const [minX, minY, maxX, maxY] = bbox;
  return Array.from({ length: count }, (_, index) => {
    const fx = ((index * 47) % 997) / 997;
    const fy = ((index * 83) % 991) / 991;
    return [minX + (maxX - minX) * fx, minY + (maxY - minY) * fy] as [number, number];
  });
}

export type { Registry } from "@eco-nojin/domain-types";
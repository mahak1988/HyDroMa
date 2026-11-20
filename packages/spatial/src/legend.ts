import { buildLegend, type LayerDescriptor, type LegendEntry } from "./layer";

/**
 * Legend model + a headless renderer.
 *
 * The legend is derived from visible layers that declare symbology, so it can
 * never disagree with the map: if a layer is hidden, its entry disappears. The
 * React component lives in the app (it needs i18n); this module stays pure so
 * tests and non-React consumers can use the same rules.
 */
export type LegendItem = LegendEntry & {
  /** True when the layer is visible; hidden entries are excluded by default. */
  visible: boolean;
};

export function buildLegendItems(
  layers: readonly LayerDescriptor[],
  options: { includeHidden?: boolean } = {},
): LegendItem[] {
  const includeHidden = options.includeHidden ?? false;
  return buildLegend(layers)
    .map((entry) => ({ ...entry, visible: true }))
    .concat(
      includeHidden
        ? layers
            .filter((layer) => !layer.visible && layer.legend)
            .map((layer) => ({ id: layer.id, ...layer.legend!, visible: false }))
        : [],
    );
}

/** Swatch style for a legend entry, ready to spread onto an element. */
export function legendSwatchStyle(entry: LegendEntry): Record<string, string> {
  const color = entry.color ?? "var(--primary)";
  if (entry.shape === "line") {
    return { backgroundColor: color, height: "2px", width: "1.25rem" };
  }
  if (entry.shape === "fill") {
    return { backgroundColor: color, height: "0.75rem", width: "1.25rem", opacity: "0.35", border: `1px solid ${color}` };
  }
  return { backgroundColor: color, height: "0.625rem", width: "0.625rem", borderRadius: "9999px" };
}

/** Group entries by layer kind for a grouped legend. */
export function groupLegendByKind(items: readonly LegendItem[]): Array<{ kind: string; items: LegendItem[] }> {
  const groups = new Map<string, LegendItem[]>();
  for (const item of items) {
    const kind = (item as LegendEntry & { kind?: string }).kind ?? "other";
    const bucket = groups.get(kind);
    if (bucket) bucket.push(item);
    else groups.set(kind, [item]);
  }
  return [...groups.entries()].map(([kind, entries]) => ({ kind, items: entries }));
}
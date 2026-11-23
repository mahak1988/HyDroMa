import type { ReactNode } from "react";

/**
 * Chart plugin registry (Phase 5, pattern from superset MainPreset).
 *
 * A chart is a self-contained plugin: id, label, and a render function. Apps
 * register charts at boot; the registry drives dashboards/reports without
 * hard-coding chart types. Keeps the same auditability as spatial layers.
 */
export type ChartPlugin = {
  id: string;
  label: string;
  render: (props: { data: unknown; width?: number; height?: number }) => ReactNode;
};

export type ChartRegistry = {
  register: (plugin: ChartPlugin) => void;
  get: (id: string) => ChartPlugin | undefined;
  list: () => ChartPlugin[];
  has: (id: string) => boolean;
  clear: () => void;
};

export function createChartRegistry(): ChartRegistry {
  const plugins = new Map<string, ChartPlugin>();
  return {
    register: (plugin) => {
      plugins.set(plugin.id, plugin);
    },
    get: (id) => plugins.get(id),
    list: () => [...plugins.values()],
    has: (id) => plugins.has(id),
    clear: () => plugins.clear(),
  };
}
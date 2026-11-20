import { describe, expect, it } from "vitest";
import {
  AreaPriorityLimiter,
  buildLegend,
  buildLegendItems,
  createLayerRegistry,
  legendSwatchStyle,
  sampleGridPoints,
  supportsLayerKind,
  capabilitiesFor,
} from "../src/index";
import type { LayerDescriptor } from "../src/index";

const layers: LayerDescriptor[] = [
  {
    id: "veg",
    label: "Vegetation",
    kind: "hexagon",
    visible: true,
    legend: { label: "Vegetation density", color: "#0f6b4f", shape: "fill" },
    provenance: { source: "demo", sourceKind: "synthetic" },
  },
  {
    id: "stations",
    label: "Stations",
    kind: "scatter",
    visible: false,
    legend: { label: "Station", color: "#0e7490", shape: "circle" },
  },
];

describe("layer registry", () => {
  it("registers and toggles visibility", () => {
    const changes: string[] = [];
    const registry = createLayerRegistry({ onLayerChange: (layer) => changes.push(`${layer.id}:${layer.visible}`) });
    registry.registerAll(layers);
    expect(registry.list()).toHaveLength(2);

    registry.toggle("stations");
    expect(registry.get("stations")?.visible).toBe(true);
    expect(changes).toContain("stations:true");
  });

  it("clamps opacity", () => {
    const registry = createLayerRegistry();
    registry.registerAll(layers);
    registry.setOpacity("veg", 3);
    expect(registry.get("veg")?.opacity).toBe(1);
  });

  it("removes by owner", () => {
    const registry = createLayerRegistry();
    registry.registerAll([{ ...layers[0]!, owner: "science" }]);
    expect(registry.removeByOwner("science")).toBe(1);
    expect(registry.list()).toHaveLength(0);
  });
});

describe("legend", () => {
  it("derives entries only from visible layers", () => {
    expect(buildLegend(layers).map((entry) => entry.id)).toEqual(["veg"]);
  });

  it("can include hidden layers for a management panel", () => {
    expect(buildLegendItems(layers, { includeHidden: true })).toHaveLength(2);
  });

  it("produces swatch styles without throwing", () => {
    expect(legendSwatchStyle({ id: "veg", label: "V", shape: "fill" })).toHaveProperty("backgroundColor");
  });
});

describe("engine capabilities", () => {
  it("maplibre supports hexagon, cesium does not", () => {
    expect(supportsLayerKind(capabilitiesFor("maplibre"), "hexagon")).toBe(true);
    expect(supportsLayerKind(capabilitiesFor("cesium"), "hexagon")).toBe(false);
  });
});

describe("AreaPriorityLimiter", () => {
  it("caps the number of features and reports the cap", () => {
    const features = Array.from({ length: 50 }, (_, index) => ({ id: index, area: index }));
    const limiter = new AreaPriorityLimiter(10);
    const result = limiter.limit(
      features,
      [-10, -10, 10, 10],
      (feature) => feature.area,
      () => [-1, -1, 1, 1],
    );
    expect(result.features).toHaveLength(10);
    expect(result.stats.isCapped).toBe(true);
    expect(result.stats.totalInViewport).toBe(50);
    // largest areas survive
    expect(Math.min(...result.features.map((feature) => feature.area))).toBeGreaterThanOrEqual(40);
  });

  it("drops features outside the viewport", () => {
    const limiter = new AreaPriorityLimiter(100);
    const result = limiter.limit(
      [{ id: 1, bbox: [0, 0, 1, 1] as [number, number, number, number] }, { id: 2, bbox: [50, 50, 51, 51] as [number, number, number, number] }],
      [-5, -5, 5, 5],
      () => 1,
      (feature) => feature.bbox,
    );
    expect(result.features.map((feature) => feature.id)).toEqual([1]);
    expect(result.stats.isCapped).toBe(false);
  });
});

describe("sampleGridPoints", () => {
  it("returns deterministic points inside the bbox", () => {
    const points = sampleGridPoints([0, 0, 10, 10], 20);
    expect(points).toHaveLength(20);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(10);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(10);
    }
  });
});
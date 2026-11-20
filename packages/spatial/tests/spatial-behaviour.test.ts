import { describe, expect, it, vi } from "vitest";
import {
  AreaPriorityLimiter,
  buildLegend,
  buildLegendItems,
  capabilitiesFor,
  createLayerRegistry,
  legendSwatchStyle,
  limitByDistance,
  sampleGridPoints,
  supportsLayerKind,
} from "../src/index";
import type { LayerDescriptor } from "../src/index";

function layer(overrides: Partial<LayerDescriptor> & Pick<LayerDescriptor, "id">): LayerDescriptor {
  return {
    label: overrides.id,
    kind: "polygon",
    visible: true,
    ...overrides,
  };
}

describe("layer registry — identity and ordering", () => {
  it("replaces a duplicate id instead of creating a second entry", () => {
    const registry = createLayerRegistry();
    registry.register(layer({ id: "a", label: "first" }));
    registry.register(layer({ id: "a", label: "second" }));
    expect(registry.list()).toHaveLength(1);
    expect(registry.get("a")?.label).toBe("second");
  });

  it("keeps insertion order deterministic", () => {
    const registry = createLayerRegistry();
    registry.registerAll([layer({ id: "z" }), layer({ id: "a" }), layer({ id: "m" })]);
    expect(registry.list().map((item) => item.id)).toEqual(["z", "a", "m"]);
  });

  it("preserves provenance and ownership through mutations", () => {
    const provenance = { source: "dem", sourceKind: "raster", model: { id: "x", version: "1" } };
    const registry = createLayerRegistry();
    registry.register(layer({ id: "dem", provenance, owner: "science" }));
    registry.setVisible("dem", false);
    registry.setOpacity("dem", 0.5);
    const stored = registry.get("dem");
    expect(stored?.provenance).toEqual(provenance);
    expect(stored?.owner).toBe("science");
    expect(stored?.visible).toBe(false);
    expect(stored?.opacity).toBe(0.5);
  });

  it("notifies on every mutation with the updated descriptor", () => {
    const seen: boolean[] = [];
    const registry = createLayerRegistry({ onLayerChange: (item) => seen.push(item.visible) });
    registry.register(layer({ id: "a" }));
    registry.toggle("a");
    registry.toggle("a");
    expect(seen).toEqual([false, true]);
  });

  it("ignores mutations for an unknown id", () => {
    const registry = createLayerRegistry();
    registry.setVisible("missing", true);
    registry.setOpacity("missing", 0.2);
    expect(registry.list()).toHaveLength(0);
  });

  it("removes only the requested owner's layers", () => {
    const registry = createLayerRegistry();
    registry.registerAll([
      layer({ id: "a", owner: "one" }),
      layer({ id: "b", owner: "two" }),
      layer({ id: "c", owner: "one" }),
    ]);
    expect(registry.removeByOwner("one")).toBe(2);
    expect(registry.list().map((item) => item.id)).toEqual(["b"]);
  });
});

describe("legend derives from symbology", () => {
  it("includes only visible layers that declare a legend", () => {
    const layers = [
      layer({ id: "a", legend: { label: "A", color: "#111111" } }),
      layer({ id: "b", visible: false, legend: { label: "B", color: "#222222" } }),
      layer({ id: "c" }),
    ];
    expect(buildLegend(layers).map((entry) => entry.id)).toEqual(["a"]);
    expect(buildLegendItems(layers, { includeHidden: true }).map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("renders a swatch style per shape without throwing", () => {
    expect(legendSwatchStyle({ id: "a", label: "A", shape: "circle", color: "#0f6b4f" })).toMatchObject({
      backgroundColor: "#0f6b4f",
    });
    expect(legendSwatchStyle({ id: "b", label: "B", shape: "line" })).toHaveProperty("height", "2px");
    expect(legendSwatchStyle({ id: "c", label: "C" })).toHaveProperty("backgroundColor");
  });
});

describe("viewport limiter — determinism and edge cases", () => {
  it("returns an empty list for empty input", () => {
    const result = new AreaPriorityLimiter(10).limit([], [0, 0, 1, 1], () => 1, () => null);
    expect(result.features).toEqual([]);
    expect(result.stats).toMatchObject({ totalInViewport: 0, renderedCount: 0, isCapped: false });
  });

  it("drops features with no bbox and features outside the viewport", () => {
    const result = new AreaPriorityLimiter(10).limit(
      [
        { id: "inside", bbox: [0, 0, 1, 1] as [number, number, number, number] },
        { id: "outside", bbox: [50, 50, 51, 51] as [number, number, number, number] },
        { id: "nobox", bbox: null },
      ],
      [-1, -1, 2, 2],
      () => 1,
      (item) => item.bbox,
    );
    expect(result.features.map((item) => item.id)).toEqual(["inside"]);
    expect(result.stats.isCapped).toBe(false);
  });

  it("clamps maxFeatures to at least one", () => {
    const limiter = new AreaPriorityLimiter(0);
    const result = limiter.limit(
      Array.from({ length: 5 }, (_, index) => ({ id: index, bbox: [0, 0, 1, 1] as [number, number, number, number] })),
      [-1, -1, 2, 2],
      () => 1,
      (item) => item.bbox,
    );
    expect(result.features).toHaveLength(1);
    expect(result.stats.isCapped).toBe(true);
  });

  it("breaks equal-priority ties deterministically by original order", () => {
    const features = Array.from({ length: 20 }, (_, index) => ({ id: index }));
    const run = () =>
      new AreaPriorityLimiter(5)
        .limit(features, [0, 0, 1, 1], () => 42, () => [0, 0, 1, 1] as [number, number, number, number])
        .features.map((item) => item.id);
    expect(run()).toEqual(run());
  });

  it("keeps the largest areas when capped", () => {
    const result = new AreaPriorityLimiter(3).limit(
      Array.from({ length: 9 }, (_, index) => ({ id: index, area: index })),
      [0, 0, 1, 1],
      (item) => item.area,
      () => [0, 0, 1, 1] as [number, number, number, number],
    );
    expect(result.features.map((item) => item.id)).toEqual([8, 7, 6]);
    expect(result.stats).toMatchObject({ totalInViewport: 9, renderedCount: 3, isCapped: true });
  });

  it("limitByDistance keeps the nearest features", () => {
    const result = limitByDistance(
      [
        { id: "far", position: [10, 10] as [number, number] },
        { id: "near", position: [0.1, 0.1] as [number, number] },
      ],
      [0, 0],
      1,
      (item) => item.position,
    );
    expect(result.features.map((item) => item.id)).toEqual(["near"]);
    expect(result.stats.isCapped).toBe(true);
  });
});

describe("engine capability gating", () => {
  it("reports support per engine kind", () => {
    // Layer kinds are gated by `supportedLayerKinds`; `terrain` is a capability
    // flag, not a layer kind, so it must be asserted on the flags instead.
    expect(supportsLayerKind(capabilitiesFor("maplibre"), "hexagon")).toBe(true);
    expect(supportsLayerKind(capabilitiesFor("maplibre"), "raster")).toBe(true);
    expect(supportsLayerKind(capabilitiesFor("cesium"), "hexagon")).toBe(false);
    expect(capabilitiesFor("maplibre").terrain).toBe(false);
    expect(capabilitiesFor("cesium").terrain).toBe(true);
  });

  it("defaults an unknown kind to maplibre capabilities", () => {
    const fallback = capabilitiesFor("unknown" as "maplibre");
    expect(fallback.supportedLayerKinds).toContain("hexagon");
  });
});

describe("sampleGridPoints", () => {
  it("is deterministic and bounded", () => {
    const a = sampleGridPoints([0, 0, 5, 5], 30);
    const b = sampleGridPoints([0, 0, 5, 5], 30);
    expect(a).toEqual(b);
    expect(a).toHaveLength(30);
    expect(a.every(([x, y]) => x >= 0 && x <= 5 && y >= 0 && y <= 5)).toBe(true);
  });
});

describe("registry duplicate policy", () => {
  it("warns via console.warn when configured to warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { Registry } = await import("@eco-nojin/domain-types");
    const registry = new Registry<number>({ onDuplicate: "warn" });
    registry.registerValue("a", 1);
    registry.registerValue("a", 2);
    expect(warn).toHaveBeenCalled();
    expect(registry.get("a")).toBe(2);
    warn.mockRestore();
  });
});
import { describe, expect, it } from "vitest";
import { resolveMapColors } from "../src/colors";
import { addBbox, addGraticule, bboxPolygon, createBaseStyle, graticule } from "../src/style";

const BBOX: [number, number, number, number] = [50, 35, 52, 37];

describe("offline basemap helpers", () => {
  it("creates a background-only base style", () => {
    const colors = resolveMapColors();
    const style = createBaseStyle(colors);
    expect(style.version).toBe(8);
    expect(style.layers).toHaveLength(1);
    expect(style.layers[0]?.id).toBe("background");
    expect(style.layers[0]?.type).toBe("background");
  });

  it("builds a graticule with two lines per division step", () => {
    const collection = graticule(BBOX, 6);
    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(14);
    const first = collection.features[0];
    expect(first?.geometry.type).toBe("LineString");
  });

  it("builds a closed bbox polygon", () => {
    const collection = bboxPolygon(BBOX);
    expect(collection.features).toHaveLength(1);
    const geometry = collection.features[0]?.geometry;
    expect(geometry?.type).toBe("Polygon");
    if (geometry?.type === "Polygon") {
      const ring = geometry.coordinates[0] ?? [];
      expect(ring).toHaveLength(5);
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it("adds a graticule source and line layer", () => {
    const style = createBaseStyle(resolveMapColors());
    addGraticule(style, BBOX, resolveMapColors(), "grid");
    expect(style.sources.grid).toEqual({ type: "geojson", data: graticule(BBOX, 6) });
    expect(style.layers.some((layer) => layer.id === "grid")).toBe(true);
  });

  it("adds an area fill and outline", () => {
    const style = createBaseStyle(resolveMapColors());
    addBbox(style, BBOX, resolveMapColors(), "area");
    expect(style.sources.area).toBeDefined();
    expect(style.layers.some((layer) => layer.id === "area-fill")).toBe(true);
    expect(style.layers.some((layer) => layer.id === "area-outline")).toBe(true);
  });

  it("resolves concrete colours with light fallbacks", () => {
    const colors = resolveMapColors();
    for (const value of Object.values(colors)) {
      expect(value.length).toBeGreaterThan(0);
      expect(value).toMatch(/^(#|rgb|hsl)/);
    }
  });
});
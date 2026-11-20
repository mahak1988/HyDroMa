import { describe, expect, it, vi } from "vitest";
import {
  createLayerRegistry,
  formatLayerErrors,
  validateLayerDescriptor,
  type LayerDescriptor,
} from "../src/index";

const valid: LayerDescriptor = {
  id: "vegetation-density",
  label: "Vegetation density",
  kind: "hexagon",
  visible: true,
  opacity: 0.55,
  legend: { label: "NDVI", color: "#0f6b4f", shape: "fill" },
  provenance: { source: "demo-grid", sourceKind: "synthetic", model: { id: "ndvi", version: "1.0" } },
};

describe("validateLayerDescriptor", () => {
  it("accepts a well-formed descriptor", () => {
    const result = validateLayerDescriptor(valid);
    expect(result.ok).toBe(true);
  });

  it("rejects a non-object", () => {
    const result = validateLayerDescriptor("nope");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors._form).toBeDefined();
  });

  it("reports every invalid field at once", () => {
    const result = validateLayerDescriptor({ id: "", label: "", kind: "hologram", visible: "yes", opacity: 3 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["id", "kind", "label", "opacity", "visible"]);
    }
  });

  it("rejects an unknown layer kind", () => {
    const result = validateLayerDescriptor({ ...valid, kind: "hologram" as unknown as LayerDescriptor["kind"] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.kind).toMatch(/kind must be one of/);
  });

  it("rejects a non-finite or out-of-range opacity", () => {
    expect(validateLayerDescriptor({ ...valid, opacity: Number.NaN }).ok).toBe(false);
    expect(validateLayerDescriptor({ ...valid, opacity: -0.1 }).ok).toBe(false);
    expect(validateLayerDescriptor({ ...valid, opacity: 1.5 }).ok).toBe(false);
  });

  it("rejects a legend with an unknown shape or no label", () => {
    expect(validateLayerDescriptor({ ...valid, legend: { label: "X", shape: "hex" } }).ok).toBe(false);
    expect(validateLayerDescriptor({ ...valid, legend: { label: "" } }).ok).toBe(false);
  });

  it("rejects provenance without a source", () => {
    const result = validateLayerDescriptor({ ...valid, provenance: { sourceKind: "synthetic" } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.provenance).toMatch(/source/);
  });

  it("allows a layer without optional provenance", () => {
    expect(validateLayerDescriptor({ ...valid, provenance: undefined }).ok).toBe(true);
  });
});

describe("createLayerRegistry validation", () => {
  it("throws on an invalid descriptor by default", () => {
    const registry = createLayerRegistry();
    expect(() => registry.register({ ...valid, id: "" })).toThrow(/Invalid layer descriptor/);
  });

  it("skips invalid descriptors when configured to", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const registry = createLayerRegistry({ onInvalid: "skip" });
    registry.register({ ...valid, kind: "hologram" as unknown as LayerDescriptor["kind"] });
    expect(registry.list()).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("rejects a non-finite opacity instead of storing NaN", () => {
    const registry = createLayerRegistry();
    registry.register(valid);
    expect(() => registry.setOpacity("vegetation-density", Number.NaN)).toThrow(/finite number/);
    expect(registry.get("vegetation-density")?.opacity).toBe(0.55);
  });

  it("clamps a finite out-of-range opacity", () => {
    const registry = createLayerRegistry();
    registry.register(valid);
    registry.setOpacity("vegetation-density", 5);
    expect(registry.get("vegetation-density")?.opacity).toBe(1);
    registry.setOpacity("vegetation-density", -5);
    expect(registry.get("vegetation-density")?.opacity).toBe(0);
  });

  it("keeps valid layers usable end to end", () => {
    const registry = createLayerRegistry();
    registry.registerAll([valid, { ...valid, id: "stations", kind: "scatter", legend: { label: "Stations", shape: "circle" } }]);
    expect(registry.list().map((layer) => layer.id)).toEqual(["vegetation-density", "stations"]);
    registry.toggle("stations");
    expect(registry.get("stations")?.visible).toBe(false);
  });
});

describe("formatLayerErrors", () => {
  it("renders one line per field", () => {
    const message = formatLayerErrors({ id: "id is required", kind: "bad kind" });
    expect(message).toBe("id: id is required; kind: bad kind");
  });
});
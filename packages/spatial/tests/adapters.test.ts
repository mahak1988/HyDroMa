import { describe, it, expect } from "vitest";
import { MapLibreAdapter, CesiumAdapter } from "../src/adapters/map-adapter";

describe("map adapters", () => {
  it("constructs without external dependencies", () => {
    expect(new MapLibreAdapter()).toBeDefined();
    expect(new CesiumAdapter()).toBeDefined();
  });
});
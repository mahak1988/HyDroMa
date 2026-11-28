import { describe, it, expect } from "vitest";
import { computeGdd, accumulateGdd, GDD_MODEL } from "../src/growing-degree-days";

describe("computeGdd", () => {
  it("computes a simple positive GDD day", () => {
    const r = computeGdd({ tMax: 30, tMin: 10, tBase: 10 });
    expect(r.gdd).toBe(10);
    expect(r.dailyMean).toBe(20);
    expect(r.capped).toBe(false);
  });

  it("clamps negative GDD to zero", () => {
    expect(computeGdd({ tMax: 12, tMin: 8, tBase: 15 }).gdd).toBe(0);
  });

  it("applies an optional upper cap", () => {
    const r = computeGdd({ tMax: 40, tMin: 20, tBase: 10, tCap: 30 });
    expect(r.capped).toBe(true);
    expect(r.gdd).toBe(15);
  });

  it("rejects invalid ranges", () => {
    expect(() => computeGdd({ tMax: 5, tMin: 10, tBase: 0 })).toThrow();
    expect(() => computeGdd({ tMax: NaN, tMin: 10, tBase: 0 })).toThrow();
  });
});

describe("accumulateGdd", () => {
  it("sums daily GDD", () => {
    const total = accumulateGdd([
      { tMax: 30, tMin: 10, tBase: 10 },
      { tMax: 20, tMin: 10, tBase: 10 },
    ]);
    expect(total).toBe(15);
  });
});

describe("GDD model metadata", () => {
  it("is marked NOT_VALIDATED", () => {
    expect(GDD_MODEL.scientificStatus).toBe("NOT_VALIDATED");
    expect(GDD_MODEL.version).toBe("1.0.0");
  });
});
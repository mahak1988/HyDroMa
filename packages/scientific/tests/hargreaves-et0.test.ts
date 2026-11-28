import { describe, it, expect } from "vitest";
import { computeHargreavesEt0, HARGREAVES_MODEL } from "../src/hargreaves-et0";

describe("computeHargreavesEt0", () => {
  it("computes a positive ET0", () => {
    const r = computeHargreavesEt0({ tMax: 30, tMin: 15, ra: 40 });
    expect(r.et0).toBeGreaterThan(0);
    expect(r.tMean).toBe(22.5);
  });

  it("clamps to zero for cold conditions", () => {
    const r = computeHargreavesEt0({ tMax: 5, tMin: -5, ra: 10 });
    expect(r.et0).toBeGreaterThanOrEqual(0);
  });

  it("rejects invalid input", () => {
    expect(() => computeHargreavesEt0({ tMax: 5, tMin: 10, ra: 10 })).toThrow();
    expect(() => computeHargreavesEt0({ tMax: 10, tMin: 5, ra: -1 })).toThrow();
  });
});

describe("HARGREAVES model metadata", () => {
  it("is NOT_VALIDATED", () => {
    expect(HARGREAVES_MODEL.scientificStatus).toBe("NOT_VALIDATED");
  });
});
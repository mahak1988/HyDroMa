import { describe, it, expect } from "vitest";
import { runGdd, runHargreavesEt0 } from "../src/engine";

const ctx = { runId: "r1", requestedBy: "tester" };

describe("custom scientific engine", () => {
  it("runs GDD and attaches provenance", () => {
    const r = runGdd({ tMax: 30, tMin: 10, tBase: 10 }, ctx);
    expect(r.status).toBe("completed");
    expect((r.outputs as { gdd: number }).gdd).toBe(10);
    expect(r.scientificStatus).toBe("NOT_VALIDATED");
    expect(r.provenance.runId).toBe("r1");
  });

  it("fails GDD on invalid input without throwing", () => {
    const r = runGdd({ tMax: 5, tMin: 10, tBase: 0 }, ctx);
    expect(r.status).toBe("failed");
    expect(r.outputs).toBeNull();
  });

  it("runs Hargreaves ET0", () => {
    const r = runHargreavesEt0({ tMax: 30, tMin: 15, ra: 40 }, ctx);
    expect(r.status).toBe("completed");
    expect((r.outputs as { et0: number }).et0).toBeGreaterThan(0);
  });

  it("fails ET0 on invalid input", () => {
    const r = runHargreavesEt0({ tMax: 5, tMin: 10, ra: 10 }, ctx);
    expect(r.status).toBe("failed");
  });
});
import { describe, expect, it } from "vitest";
import {
  computeWaterBalance,
  validateWaterBalanceInput,
  WATER_BALANCE_MODEL,
  M3_PER_MM_HA,
  type WaterBalanceSuccess,
} from "../src";

const base = {
  periodDays: 30,
  precipitation: 100,
  irrigation: 50,
  runoff: 10,
  evapotranspiration: 120,
  deepPercolation: 5,
};

/** Narrowing helper: a failed computation must fail the test loudly. */
function compute(input: Parameters<typeof computeWaterBalance>[0]): WaterBalanceSuccess {
  const result = computeWaterBalance(input);
  if (!result.ok) throw new Error(`expected ok, received ${JSON.stringify(result.errors)}`);
  return result;
}

describe("water balance", () => {
  it("closes with the defined sign convention", () => {
    const r = compute(base);
    // ΔS = 100 + 50 + 0 − 120 − 10 − 5 = 15
    expect(r.result.storageChangeMm).toBe(15);
    expect(r.components.inflow).toBe(150);
    expect(r.components.outflow).toBe(135);
    expect(r.result.status).toBe("surplus");
  });

  it("reports a deficit when outflow exceeds inflow", () => {
    const r = compute({ ...base, evapotranspiration: 200 });
    expect(r.result.storageChangeMm).toBe(-65);
    expect(r.result.status).toBe("deficit");
    expect(r.warnings.some((w) => w.code === "ET_GT_INFLOW")).toBe(true);
  });

  it("defaults optional fluxes to zero and records that it did", () => {
    const r = compute({ periodDays: 10, precipitation: 30, irrigation: 0, runoff: 0, evapotranspiration: 30 });
    expect(r.components.DP).toBe(0);
    expect(r.components.CR).toBe(0);
    expect(r.result.storageChangeMm).toBe(0);
    expect(r.result.status).toBe("balanced");
    expect(r.defaultsApplied).toEqual(["deepPercolation", "capillaryRise"]);
  });

  it("treats capillary rise as an inflow", () => {
    const without = compute(base).result.storageChangeMm;
    const withCR = compute({ ...base, capillaryRise: 12 }).result.storageChangeMm;
    expect(withCR - without).toBe(12);
  });

  it("converts depth to volume using area (1 mm over 1 ha = 10 m³)", () => {
    expect(M3_PER_MM_HA).toBe(10);
    const r = compute({ ...base, areaHa: 10 });
    expect(r.result.storageChangeMm).toBe(15);
    expect(r.result.storageChangeM3).toBe(1500);
    expect(r.result.inflowM3).toBe(15000);
  });

  it("reports runoff coefficient only when precipitation is positive", () => {
    expect(compute({ ...base, precipitation: 100, runoff: 25 }).result.runoffCoefficient).toBe(0.25);
    const noRain = compute({ periodDays: 5, precipitation: 0, irrigation: 40, runoff: 0, evapotranspiration: 30 });
    expect(noRain.result.runoffCoefficient).toBeNull();
  });

  it("computes a closure residual against measured storage change", () => {
    const closes = compute({ ...base, measuredStorageChange: 15 });
    expect(closes.result.residualMm).toBe(0);
    expect(closes.result.balanceCloses).toBe(true);

    const mismatch = compute({ ...base, measuredStorageChange: 40 });
    expect(mismatch.result.residualMm).toBe(-25);
    expect(mismatch.result.balanceCloses).toBe(false);
    expect(mismatch.warnings.some((w) => w.code === "CLOSURE_MISMATCH")).toBe(true);
  });

  it("allows a negative measured change (drying)", () => {
    const r = compute({ ...base, measuredStorageChange: -65 });
    expect(r.result.residualMm).toBe(80);
  });

  it("rejects invalid inputs with coded errors", () => {
    const cases = [
      { input: { ...base, precipitation: -5 }, code: "NEGATIVE", field: "precipitation" },
      { input: { ...base, evapotranspiration: "abc" }, code: "NOT_FINITE", field: "evapotranspiration" },
      { input: { ...base, runoff: undefined }, code: "MISSING", field: "runoff" },
      { input: { ...base, periodDays: 0 }, code: "PERIOD_INVALID", field: "periodDays" },
      { input: { ...base, periodDays: 12.5 }, code: "PERIOD_INVALID", field: "periodDays" },
      { input: { ...base, areaHa: -2 }, code: "AREA_INVALID", field: "areaHa" },
      { input: { ...base, initialStorage: -1 }, code: "STORAGE_INVALID", field: "initialStorage" },
    ] as const;

    for (const testCase of cases) {
      const validation = validateWaterBalanceInput(testCase.input);
      expect(validation.valid, `expected invalid for ${testCase.field}`).toBe(false);
      expect(
        validation.errors.some((error) => error.code === testCase.code && error.field === testCase.field),
        `missing ${testCase.code}/${testCase.field}`,
      ).toBe(true);
      expect(computeWaterBalance(testCase.input).ok).toBe(false);
    }
  });

  it("flags physically implausible runoff greater than all inflow", () => {
    const r = compute({ ...base, runoff: 300 });
    expect(r.warnings.some((w) => w.code === "RUNOFF_GT_INPUT")).toBe(true);
    expect(r.result.outOfDomain).toBe(true);
  });

  it("never serves a negative final storage as a value", () => {
    const r = compute({ ...base, evapotranspiration: 220, initialStorage: 5 });
    expect(r.result.finalStorageMm).toBeNull();
    expect(r.result.outOfDomain).toBe(true);
    expect(r.warnings.some((w) => w.code === "NEGATIVE_STORAGE")).toBe(true);
  });

  it("is deterministic and free of timestamps", () => {
    const a = compute(base);
    const b = compute(base);
    expect(a).toEqual(b);
    expect("computedAt" in a).toBe(false);
  });

  it("reports model identity, validation state and references", () => {
    const r = compute(base);
    expect(r.model.state).toBe("NOT_VALIDATED");
    expect(r.model.id).toBe("eco-nojin.hydroma.water-balance");
    expect(r.model.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(r.references.length).toBeGreaterThanOrEqual(3);
    expect(r.assumptions.length).toBeGreaterThanOrEqual(3);
    expect(r.limitations.length).toBeGreaterThanOrEqual(3);
    expect(WATER_BALANCE_MODEL.units.depth).toBe("mm");
    expect(r.model.validation.scientificValidation).toBe("not_performed");
  });

  it("exposes the equation with substitution and units", () => {
    const r = compute(base);
    expect(r.equation.formulaDisplay).toMatch(/ΔS = P \+ I \+ CR/);
    expect(r.equation.substitution).toMatch(/mm$/);
    expect(r.result.unit).toBe("mm");
  });
});
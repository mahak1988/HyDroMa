// Eco Nojin — HyDroMA scientific core: root-zone water balance.
//
// ARCHITECTURAL BOUNDARY
// ----------------------
// This module is the *science engine boundary*. It is pure, deterministic and
// has no DOM, no network and no storage access. It can be replaced by a remote
// engine (a future Python/HyDroMA service) as long as it keeps the same
// contract:
//
//     computeWaterBalance(input) -> { ok, model, inputs, components, result,
//                                     equation, warnings, assumptions,
//                                     limitations, references }
//
// The UI must depend only on this contract, never on internal details.
//
// SCIENTIFIC BASIS
// ----------------
// Control volume: the soil/root zone of a defined area over a defined period.
// Water balance for the control volume (depths, all in mm over the period):
//
//     ΔS = P + I + CR − ET − R − DP
//
// where
//     ΔS  change in soil-water storage         (+ = storage increases)
//     P   precipitation input                 (+)  [required]
//     I   irrigation input                    (+)  [required]
//     CR  capillary rise into the root zone   (+)  [optional, default 0]
//     ET  actual evapotranspiration           (−)  [required]
//     R   surface runoff leaving              (−)  [required]
//     DP  deep percolation below the root zone (−) [optional, default 0]
//
// Sign convention: inflows are positive contributions to storage; outflows are
// subtracted. ΔS > 0 means the root zone wet up; ΔS < 0 means it dried down.
//
// The model is NOT calibrated or validated and must not be presented as an
// official or measured result. See `assumptions` / `limitations` in the output.

export type ScientificState = "NOT_VALIDATED" | "VALIDATED";

export const WATER_BALANCE_MODEL = Object.freeze({
  id: "eco-nojin.hydroma.water-balance",
  version: "1.1.0",
  state: "NOT_VALIDATED" as ScientificState,
  equation: "deltaS = P + I + CR - ET - R - DP",
  units: Object.freeze({ depth: "mm", area: "ha", volume: "m3", period: "day", coefficient: "1" }),
  /**
   * Passing software tests is NOT scientific validation. The scientific state
   * stays NOT_VALIDATED until the criteria below are satisfied by independent
   * measured data and review.
   */
  validation: Object.freeze({
    status: "NOT_VALIDATED" as ScientificState,
    softwareTests: "unit_tests_passing",
    scientificValidation: "not_performed",
    note: "Green unit tests are not equivalent to scientific validation.",
    requires: Object.freeze([
      "Independent measured dataset (field/station) for the same period and control volume",
      "Calibration against observed storage or flux measurements",
      "Documented uncertainty, bias and residual assessment",
      "Independent peer review of the implementation and assumptions",
    ]),
  }),
});

export type WaterBalanceModel = typeof WATER_BALANCE_MODEL;

export const SIGN_CONVENTION = Object.freeze({
  storage: "deltaS_positive_is_storage_increase",
  inflow: Object.freeze(["P", "I", "CR"]),
  outflow: Object.freeze(["ET", "R", "DP"]),
});

/** A depth may be given as a number or as a decimal string (form input). */
export type NumericInput = number | string | null | undefined;

export type WaterBalanceInput = {
  periodDays?: NumericInput;
  precipitation?: NumericInput;
  irrigation?: NumericInput;
  runoff?: NumericInput;
  evapotranspiration?: NumericInput;
  deepPercolation?: NumericInput;
  capillaryRise?: NumericInput;
  areaHa?: NumericInput;
  initialStorage?: NumericInput;
  measuredStorageChange?: NumericInput;
};

export type ErrorCode = "MISSING" | "NOT_FINITE" | "NEGATIVE" | "PERIOD_INVALID" | "AREA_INVALID" | "STORAGE_INVALID";

export type WarningCode = "ET_GT_INFLOW" | "RUNOFF_GT_INPUT" | "NO_PRECIP_RUNOFF" | "NEGATIVE_STORAGE" | "CLOSURE_MISMATCH";

export type ValidationError = {
  field: keyof WaterBalanceInput;
  symbol: string;
  code: ErrorCode;
  value: unknown;
  unit: string;
};

export type Warning = {
  code: WarningCode;
  value: number;
  unit: string;
  tolerance?: number;
};

export type WaterBalanceSuccess = {
  ok: true;
  model: WaterBalanceModel;
  inputsProvided: { deepPercolation: boolean; capillaryRise: boolean };
  defaultsApplied: Array<"deepPercolation" | "capillaryRise">;
  inputs: {
    periodDays: number;
    areaHa: number | null;
    precipitation: number;
    irrigation: number;
    runoff: number;
    evapotranspiration: number;
    deepPercolation: number;
    capillaryRise: number;
    initialStorage: number | null;
    measuredStorageChange: number | null;
  };
  components: { P: number; I: number; CR: number; ET: number; R: number; DP: number; inflow: number; outflow: number };
  result: {
    storageChangeMm: number;
    storageChangeM3: number | null;
    inflowMm: number;
    outflowMm: number;
    inflowM3: number | null;
    outflowM3: number | null;
    runoffCoefficient: number | null;
    residualMm: number | null;
    residualM3: number | null;
    residualDefinition: "deltaS_computed_minus_deltaS_observed";
    closureToleranceMm: number;
    balanceCloses: boolean | null;
    initialStorageMm: number | null;
    finalStorageMm: number | null;
    outOfDomain: boolean;
    status: "surplus" | "deficit" | "balanced";
    unit: "mm";
  };
  equation: { formula: string; formulaDisplay: string; substitution: string };
  signConvention: typeof SIGN_CONVENTION;
  warnings: Warning[];
  assumptions: readonly string[];
  limitations: readonly string[];
  references: readonly string[];
};

export type WaterBalanceFailure = {
  ok: false;
  model: WaterBalanceModel;
  errors: ValidationError[];
};

export type WaterBalanceResult = WaterBalanceSuccess | WaterBalanceFailure;

const REQUIRED_FIELDS = [
  { name: "precipitation", symbol: "P", unit: "mm" },
  { name: "irrigation", symbol: "I", unit: "mm" },
  { name: "runoff", symbol: "R", unit: "mm" },
  { name: "evapotranspiration", symbol: "ET", unit: "mm" },
] as const satisfies ReadonlyArray<{ name: keyof WaterBalanceInput; symbol: string; unit: string }>;

const OPTIONAL_MAGNITUDE_FIELDS = [
  { name: "deepPercolation", symbol: "DP", unit: "mm" },
  { name: "capillaryRise", symbol: "CR", unit: "mm" },
] as const satisfies ReadonlyArray<{ name: keyof WaterBalanceInput; symbol: string; unit: string }>;

/** 1 mm of water over 1 ha = 10 m³. */
export const M3_PER_MM_HA = 10;

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (value === "" || value === null || value === undefined) return Number.NaN;
  return Number(value);
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || value === "";

const round = (value: number, decimals = 4): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Validate a water-balance input.
 * Error codes: MISSING, NOT_FINITE, NEGATIVE, PERIOD_INVALID, AREA_INVALID, STORAGE_INVALID.
 */
export function validateWaterBalanceInput(input: WaterBalanceInput = {}): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  const period = toNumber(input.periodDays);
  if (!isFiniteNumber(period) || period <= 0 || !Number.isInteger(period)) {
    errors.push({ field: "periodDays", symbol: "days", code: "PERIOD_INVALID", value: input.periodDays, unit: "day" });
  }

  for (const field of REQUIRED_FIELDS) {
    const raw = input[field.name];
    if (isBlank(raw)) {
      errors.push({ field: field.name, symbol: field.symbol, code: "MISSING", value: raw, unit: field.unit });
      continue;
    }
    const value = toNumber(raw);
    if (!isFiniteNumber(value)) {
      errors.push({ field: field.name, symbol: field.symbol, code: "NOT_FINITE", value: raw, unit: field.unit });
    } else if (value < 0) {
      errors.push({ field: field.name, symbol: field.symbol, code: "NEGATIVE", value, unit: field.unit });
    }
  }

  for (const field of OPTIONAL_MAGNITUDE_FIELDS) {
    const raw = input[field.name];
    if (isBlank(raw)) continue;
    const value = toNumber(raw);
    if (!isFiniteNumber(value)) {
      errors.push({ field: field.name, symbol: field.symbol, code: "NOT_FINITE", value: raw, unit: field.unit });
    } else if (value < 0) {
      errors.push({ field: field.name, symbol: field.symbol, code: "NEGATIVE", value, unit: field.unit });
    }
  }

  if (!isBlank(input.areaHa)) {
    const area = toNumber(input.areaHa);
    if (!isFiniteNumber(area) || area <= 0) {
      errors.push({ field: "areaHa", symbol: "A", code: "AREA_INVALID", value: input.areaHa, unit: "ha" });
    }
  }

  if (!isBlank(input.initialStorage)) {
    const storage = toNumber(input.initialStorage);
    if (!isFiniteNumber(storage) || storage < 0) {
      errors.push({ field: "initialStorage", symbol: "S0", code: "STORAGE_INVALID", value: input.initialStorage, unit: "mm" });
    }
  }

  if (!isBlank(input.measuredStorageChange) && !isFiniteNumber(toNumber(input.measuredStorageChange))) {
    errors.push({
      field: "measuredStorageChange",
      symbol: "dS_obs",
      code: "NOT_FINITE",
      value: input.measuredStorageChange,
      unit: "mm",
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Compute the root-zone water balance. Deterministic and pure.
 * Returns either a coded failure or a full, provenance-carrying result.
 */
export function computeWaterBalance(input: WaterBalanceInput = {}): WaterBalanceResult {
  const { valid, errors } = validateWaterBalanceInput(input);
  if (!valid) return { ok: false, model: WATER_BALANCE_MODEL, errors };

  // Distinguish "missing" from "explicit zero": required fields are validated
  // above; optional fluxes may be omitted (default 0, flagged) or given as zero.
  const provided = {
    deepPercolation: !isBlank(input.deepPercolation),
    capillaryRise: !isBlank(input.capillaryRise),
  };
  const defaultsApplied: Array<"deepPercolation" | "capillaryRise"> = [];
  if (!provided.deepPercolation) defaultsApplied.push("deepPercolation");
  if (!provided.capillaryRise) defaultsApplied.push("capillaryRise");

  const P = toNumber(input.precipitation);
  const I = toNumber(input.irrigation);
  const R = toNumber(input.runoff);
  const ET = toNumber(input.evapotranspiration);
  const DP = provided.deepPercolation ? toNumber(input.deepPercolation) : 0;
  const CR = provided.capillaryRise ? toNumber(input.capillaryRise) : 0;
  const periodDays = toNumber(input.periodDays);

  const areaHa = isBlank(input.areaHa) ? null : toNumber(input.areaHa);
  const initialStorage = isBlank(input.initialStorage) ? null : toNumber(input.initialStorage);
  const measuredStorageChange = isBlank(input.measuredStorageChange) ? null : toNumber(input.measuredStorageChange);

  const inflow = P + I + CR;
  const outflow = ET + R + DP;
  const storageChange = inflow - outflow;

  const toVolume = (mm: number): number | null => (areaHa !== null ? mm * areaHa * M3_PER_MM_HA : null);

  const runoffCoefficient = P > 0 ? R / P : null;
  const residual = measuredStorageChange !== null ? storageChange - measuredStorageChange : null;
  const closureTolerance = Math.max(1, 0.02 * Math.abs(inflow));
  const balanceCloses = residual === null ? null : Math.abs(residual) <= closureTolerance;

  const EPS = 1e-9;
  const status: "surplus" | "deficit" | "balanced" =
    storageChange > EPS ? "surplus" : storageChange < -EPS ? "deficit" : "balanced";

  // Final storage must never be served as a physically invalid negative value.
  const rawFinalStorage = initialStorage !== null ? initialStorage + storageChange : null;
  const finalStorageMm =
    rawFinalStorage !== null && rawFinalStorage >= -EPS ? round(Math.max(0, rawFinalStorage)) : null;

  // Out of domain: negative final storage (when initial storage is known) or
  // runoff exceeding every inflow — both are physically implausible here.
  const outOfDomain = (rawFinalStorage !== null && rawFinalStorage < -EPS) || R > inflow + EPS;

  // Warnings are structured codes; the UI localises them (codes are unchanged).
  const warnings: Warning[] = [];
  if (ET > inflow + EPS) warnings.push({ code: "ET_GT_INFLOW", value: round(ET - inflow), unit: "mm" });
  if (R > inflow + EPS) warnings.push({ code: "RUNOFF_GT_INPUT", value: round(R - inflow), unit: "mm" });
  if (P === 0 && R > 0) warnings.push({ code: "NO_PRECIP_RUNOFF", value: round(R), unit: "mm" });
  if (rawFinalStorage !== null && rawFinalStorage < -EPS) {
    warnings.push({ code: "NEGATIVE_STORAGE", value: round(rawFinalStorage), unit: "mm" });
  }
  if (residual !== null && !balanceCloses) {
    warnings.push({ code: "CLOSURE_MISMATCH", value: round(residual), unit: "mm", tolerance: round(closureTolerance) });
  }

  const equation = {
    formula: "dS = P + I + CR - ET - R - DP",
    formulaDisplay: "ΔS = P + I + CR − ET − R − DP",
    substitution: `ΔS = ${round(P, 2)} + ${round(I, 2)} + ${round(CR, 2)} − ${round(ET, 2)} − ${round(R, 2)} − ${round(DP, 2)} = ${round(storageChange, 2)} mm`,
  };

  return {
    ok: true,
    model: WATER_BALANCE_MODEL,
    inputsProvided: provided,
    defaultsApplied,
    inputs: {
      periodDays,
      areaHa,
      precipitation: P,
      irrigation: I,
      runoff: R,
      evapotranspiration: ET,
      deepPercolation: DP,
      capillaryRise: CR,
      initialStorage,
      measuredStorageChange,
    },
    components: { P, I, CR, ET, R, DP, inflow: round(inflow), outflow: round(outflow) },
    result: {
      storageChangeMm: round(storageChange),
      storageChangeM3: areaHa !== null ? round(toVolume(storageChange) ?? 0) : null,
      inflowMm: round(inflow),
      outflowMm: round(outflow),
      inflowM3: areaHa !== null ? round(toVolume(inflow) ?? 0) : null,
      outflowM3: areaHa !== null ? round(toVolume(outflow) ?? 0) : null,
      runoffCoefficient: runoffCoefficient === null ? null : round(runoffCoefficient, 4),
      residualMm: residual === null ? null : round(residual),
      residualM3: residual !== null && areaHa !== null ? round(toVolume(residual) ?? 0) : null,
      residualDefinition: "deltaS_computed_minus_deltaS_observed",
      closureToleranceMm: round(closureTolerance),
      balanceCloses,
      initialStorageMm: initialStorage === null ? null : round(initialStorage),
      finalStorageMm,
      outOfDomain,
      status,
      unit: "mm",
    },
    equation,
    signConvention: SIGN_CONVENTION,
    warnings,
    assumptions: ["controlVolume", "samePeriodArea", "actualET", "noLateralNoSnow", "storageSoilOnly"],
    limitations: ["notValidated", "singleControlVolume", "dprCrUserProvided", "fixedSignConvention", "notOfficial"],
    references: [
      "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). Crop evapotranspiration — Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56.",
      "Dingman, S.L. (2015). Physical Hydrology (3rd ed.). Waveland Press.",
      "Hillel, D. (1998). Environmental Soil Physics. Academic Press.",
      "WMO (2010). Guide to Hydrological Practices, Volume I (WMO-No. 168).",
    ],
  };
}
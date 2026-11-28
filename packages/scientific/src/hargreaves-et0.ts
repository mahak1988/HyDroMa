/**
 * Hargreaves-Samani reference evapotranspiration (ET0).
 *
 * Pure, deterministic, no external dependencies. Scientifically NOT_VALIDATED:
 * this is a software implementation of the Hargreaves-Samani temperature-based
 * equation, not a calibrated or independently validated model.
 *
 * ET0 (mm/day) = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * 0.408 * Ra
 * where Ra is extraterrestrial radiation in MJ/m^2/day.
 */

export interface HargreavesInput {
  tMax: number;
  tMin: number;
  ra: number;
}

export interface HargreavesResult {
  et0: number;
  tMean: number;
}

export function computeHargreavesEt0(input: HargreavesInput): HargreavesResult {
  const { tMax, tMin, ra } = input;
  if (![tMax, tMin, ra].every((v) => Number.isFinite(v))) {
    throw new Error("tMax, tMin and ra must be finite numbers");
  }
  if (tMin > tMax) throw new Error("tMin must be <= tMax");
  if (ra < 0) throw new Error("ra must be >= 0");

  const tMean = (tMax + tMin) / 2;
  const deltaT = Math.sqrt(Math.max(0, tMax - tMin));
  const et0 = 0.0023 * (tMean + 17.8) * deltaT * 0.408 * ra;
  return { et0: Math.max(0, et0), tMean };
}

export const HARGREAVES_MODEL = {
  id: "eco-nojin.hargreaves-et0",
  version: "1.0.0",
  scientificStatus: "NOT_VALIDATED",
  units: { et0: "mm/day" },
} as const;
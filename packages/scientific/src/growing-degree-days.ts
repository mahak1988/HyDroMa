/**
 * Growing Degree Days (GDD) — agricultural phenology helper.
 *
 * Pure, deterministic, no external dependencies. Scientifically NOT_VALIDATED:
 * this is a software implementation of the standard GDD formula, not a
 * calibrated or independently validated agronomic model.
 *
 * Formula (base temperature, no upper cap by default):
 *   GDD_day = max(0, (Tmax + Tmin) / 2 - Tbase)
 */

export interface GddInput {
  tMax: number;
  tMin: number;
  tBase: number;
  tCap?: number;
}

export interface GddResult {
  gdd: number;
  dailyMean: number;
  capped: boolean;
}

export function computeGdd(input: GddInput): GddResult {
  const { tMax, tMin, tBase } = input;
  if (![tMax, tMin, tBase].every((v) => Number.isFinite(v))) {
    throw new Error("tMax, tMin and tBase must be finite numbers");
  }
  if (tMin > tMax) throw new Error("tMin must be <= tMax");

  let tMaxCapped = tMax;
  let capped = false;
  if (input.tCap != null && Number.isFinite(input.tCap) && tMaxCapped > input.tCap) {
    tMaxCapped = input.tCap;
    capped = true;
  }

  const dailyMean = (tMaxCapped + tMin) / 2;
  const gdd = Math.max(0, dailyMean - tBase);
  return { gdd, dailyMean, capped };
}

export function accumulateGdd(days: GddInput[]): number {
  return days.reduce((sum, day) => sum + computeGdd(day).gdd, 0);
}

export const GDD_MODEL = {
  id: "eco-nojin.gdd",
  version: "1.0.0",
  scientificStatus: "NOT_VALIDATED",
  units: { gdd: "degree-day" },
} as const;
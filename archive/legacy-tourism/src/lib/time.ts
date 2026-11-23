import type { GeoGeometry, LngLat, Sensitivity, ValidityWindow } from "@eco-nojin/domain-types";

const DAY_MS = 86_400_000;

/** Parse an ISO date (YYYY-MM-DD) as UTC midnight. */
export function parseISO(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseISO(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

/** True for a strict YYYY-MM-DD calendar date (no empty or partial input). */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return false;
  return isoDate(date) === value;
}

/**
 * `addDays` that never throws on invalid input. Empty or malformed values
 * return an empty string so callers can render an empty `min` attribute.
 */
export function addDaysSafe(value: string, days: number): string {
  return isValidIsoDate(value) ? addDays(value, days) : "";
}

/** Whole nights between two ISO dates; never negative. */
export function nightsBetween(start: string, end: string): number {
  const diff = parseISO(end).getTime() - parseISO(start).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.round(diff / DAY_MS);
}

/** Inclusive check against an optional validity window. ISO strings compare lexicographically. */
export function isWithinValidity(date: string, window: ValidityWindow | null): boolean {
  if (!window) return true;
  return date >= window.from && date <= window.to;
}

export function isMonthActive(date: string, months: number[] | null): boolean {
  if (!months || months.length === 0) return true;
  return months.includes(parseISO(date).getUTCMonth() + 1);
}

/** A seasonal feature is active when both its month set and validity window allow it. */
export function isSeasonActive(
  date: string,
  feature: { validity: ValidityWindow | null; months: number[] | null },
): boolean {
  return isMonthActive(date, feature.months) && isWithinValidity(date, feature.validity);
}

export function sensitivityLabelKey(sensitivity: Sensitivity): "public" | "review-required" | "sensitive" {
  return sensitivity;
}

/**
 * Only features explicitly cleared as `public` may be drawn. `review-required`
 * means consent/clearance is still pending, so it is treated like `sensitive`
 * on public surfaces.
 */
export function isPublicGeometry(sensitivity: Sensitivity): boolean {
  return sensitivity === "public";
}

/** True when a feature exists but is withheld from public surfaces. */
export function isWithheldGeometry(sensitivity: Sensitivity): boolean {
  return !isPublicGeometry(sensitivity);
}

export type Bbox = [number, number, number, number];

export function bboxOfGeometry(geometry: GeoGeometry | null): Bbox | null {
  if (!geometry) return null;
  const points: LngLat[] =
    geometry.type === "Point"
      ? [geometry.coordinates]
      : geometry.type === "LineString"
        ? geometry.coordinates
        : geometry.coordinates.flat();
  if (points.length === 0) return null;
  let minX = points[0]![0];
  let minY = points[0]![1];
  let maxX = minX;
  let maxY = minY;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

export function bboxOfPath(path: LngLat[]): Bbox | null {
  return bboxOfGeometry({ type: "LineString", coordinates: path });
}

/** Bbox intersection test. Generalized geometries only; this is a demo overlap signal. */
export function bboxesOverlap(a: Bbox | null, b: Bbox | null): boolean {
  if (!a || !b) return false;
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

export type ZoneLike = { id: string; geometry: GeoGeometry; validity: ValidityWindow | null; months: number[] | null };

export type OverlapPair<T extends ZoneLike = ZoneLike> = { a: T; b: T };

/** Active zones whose generalized geometries overlap on the given date. */
export function activeOverlaps<T extends ZoneLike>(zones: T[], date: string): Array<OverlapPair<T>> {
  const active = zones.filter((zone) => isSeasonActive(date, zone));
  const pairs: Array<OverlapPair<T>> = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i]!;
      const b = active[j]!;
      if (bboxesOverlap(bboxOfGeometry(a.geometry), bboxOfGeometry(b.geometry))) pairs.push({ a, b });
    }
  }
  return pairs;
}
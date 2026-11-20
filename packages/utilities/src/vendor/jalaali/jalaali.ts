/*
 * Jalaali (Persian/Solar Hijri) calendar conversion.
 *
 * VENDORED — do not edit unless you also update the provenance note.
 * Source: https://github.com/jalaali/jalaali-js (MIT)
 * Copyright (c) 2020 Behrang Norouzinia — full licence in ./LICENSE
 *
 * Changes made when vendoring:
 *   - CommonJS `module.exports` converted to ES module named exports.
 *   - JSDoc/TypeScript types added; the algorithm itself is unchanged.
 *
 * The conversion is the reference implementation of the 33-year arithmetic
 * calendar; it is verified against ICU in `packages/utilities/tests/jalali.test.ts`.
 */

const BREAKS: readonly number[] = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
];

export type JalaaliDate = { jy: number; jm: number; jd: number };
export type GregorianDate = { gy: number; gm: number; gd: number };

const div = (a: number, b: number): number => ~~(a / b);
const mod = (a: number, b: number): number => a - ~~(a / b) * b;

/** Number of years since the last leap year (0–4). */
function jalCalLeap(jy: number): number {
  const bl = BREAKS.length;
  let jp = BREAKS[0]!;
  let jm = 0;
  let jump = 0;
  let n: number;
  let i: number;

  if (jy < jp || jy >= BREAKS[bl - 1]!) throw new Error(`Invalid Jalaali year ${jy}`);

  for (i = 1; i < bl; i += 1) {
    jm = BREAKS[i]!;
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  n = jy - jp;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return leap;
}

/** Leap year, Gregorian year of Farvardin 1 and the March day it falls on. */
export function jalCal(jy: number, withoutLeap = false): { leap?: number; gy: number; march: number } {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0]!;
  let jm = 0;
  let jump = 0;
  let n: number;
  let i: number;

  if (jy < jp || jy >= BREAKS[bl - 1]!) throw new Error(`Invalid Jalaali year ${jy}`);

  for (i = 1; i < bl; i += 1) {
    jm = BREAKS[i]!;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (withoutLeap) return { gy, march };

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

/** Jalaali date → Julian Day number. */
export function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

/** Julian Day number → Jalaali date. */
export function d2j(jdn: number): JalaaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);

  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

/** Gregorian date → Julian Day number. */
export function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** Julian Day number → Gregorian date. */
export function d2g(jdn: number): GregorianDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function toJalaali(gy: number, gm: number, gd: number): JalaaliDate;
export function toJalaali(date: Date): JalaaliDate;
export function toJalaali(input: number | Date, gm?: number, gd?: number): JalaaliDate {
  if (input instanceof Date) return d2j(g2d(input.getFullYear(), input.getMonth() + 1, input.getDate()));
  return d2j(g2d(input, gm ?? 1, gd ?? 1));
}

export function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
  return d2g(j2d(jy, jm, jd));
}

export function isValidJalaaliDate(jy: number, jm: number, jd: number): boolean {
  return jy >= -61 && jy <= 3177 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= jalaaliMonthLength(jy, jm);
}

export function isLeapJalaaliYear(jy: number): boolean {
  return jalCalLeap(jy) === 0;
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  if (isLeapJalaaliYear(jy)) return 30;
  return 29;
}

export function jalaaliToDateObject(
  jy: number,
  jm: number,
  jd: number,
  h = 0,
  m = 0,
  s = 0,
  ms = 0,
): Date {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd, h, m, s, ms);
}

/** Saturday and Friday of the week containing the given Jalaali date. */
export function jalaaliWeek(jy: number, jm: number, jd: number): { saturday: JalaaliDate; friday: JalaaliDate } {
  const dayOfWeek = jalaaliToDateObject(jy, jm, jd).getDay();
  const startDayDifference = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1);
  const endDayDifference = 6 + startDayDifference;
  return {
    saturday: d2j(j2d(jy, jm, jd + startDayDifference)),
    friday: d2j(j2d(jy, jm, jd + endDayDifference)),
  };
}

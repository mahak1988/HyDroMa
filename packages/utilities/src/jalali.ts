import { toGregorian, toJalaali, jalaaliMonthLength, isLeapJalaaliYear } from "./vendor/jalaali/jalaali";

export type JalaliParts = { year: number; month: number; day: number };

const FA_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const EN_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
] as const;

/** Gregorian date → Jalaali parts (local calendar date, no timezone games). */
export function jalaliParts(value: Date | string | number): JalaliParts {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { year: 0, month: 0, day: 0 };
  const { jy, jm, jd } = toJalaali(date);
  return { year: jy, month: jm, day: jd };
}

/** Jalaali parts → Gregorian Date at local midnight. */
export function jalaliToDate(parts: JalaliParts): Date | null {
  if (!Number.isInteger(parts.year) || parts.month < 1 || parts.month > 12) return null;
  const max = jalaaliMonthLength(parts.year, parts.month);
  if (parts.day < 1 || parts.day > max) return null;
  const { gy, gm, gd } = toGregorian(parts.year, parts.month, parts.day);
  return new Date(gy, gm - 1, gd);
}

export function jalaliMonthName(month: number, locale: string): string {
  const index = Math.min(Math.max(month, 1), 12) - 1;
  if (locale === "fa") return FA_MONTHS[index] ?? "";
  if (locale === "en") return EN_MONTHS[index] ?? "";
  return String(month);
}

const formatterFor = (locale: string, minimumIntegerDigits = 1): Intl.NumberFormat =>
  new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar-EG" : "en-US", {
    minimumIntegerDigits,
    useGrouping: false,
  });

/**
 * Human-readable date in the Persian calendar.
 * fa: «۲۹ آبان ۱۴۰۵» · en: «29 Aban 1405» · ar: numeric «۱۴۰۵/۰۸/۲۹».
 */
export function formatJalali(value: Date | string | number, locale = "fa"): string {
  const { year, month, day } = jalaliParts(value);
  if (year === 0) return "—";
  const number = formatterFor(locale);
  if (locale === "fa" || locale === "en") {
    return `${number.format(day)} ${jalaliMonthName(month, locale)} ${number.format(year)}`;
  }
  const two = formatterFor(locale, 2);
  return `${formatterFor(locale, 4).format(year)}/${two.format(month)}/${two.format(day)}`;
}

/** Short numeric form for tables: ۱۴۰۵/۰۸/۲۹ (fa), 1405-08-29 (en). */
export function formatJalaliShort(value: Date | string | number, locale = "fa"): string {
  const { year, month, day } = jalaliParts(value);
  if (year === 0) return "—";
  if (locale === "en") {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const two = formatterFor(locale, 2);
  return `${formatterFor(locale, 4).format(year)}/${two.format(month)}/${two.format(day)}`;
}

/** Start (1 Farvardin) and end (last Esfand) of the Jalaali year containing `value`. */
export function jalaliYearRange(value: Date | string | number): { from: Date; to: Date } {
  const { year } = jalaliParts(value);
  const from = jalaliToDate({ year, month: 1, day: 1 }) ?? new Date();
  const to = jalaliToDate({ year, month: 12, day: jalaaliMonthLength(year, 12) }) ?? new Date();
  return { from, to };
}

export function isJalaliLeapYear(year: number): boolean {
  return isLeapJalaaliYear(year);
}

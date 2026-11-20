import { describe, expect, it } from "vitest";
import {
  formatJalali,
  formatJalaliShort,
  isJalaliLeapYear,
  jalaliParts,
  jalaliToDate,
  jalaliYearRange,
} from "../src/jalali";

/** IEEE-independent reference: ICU knows the Persian calendar. */
// Formatted in the local zone on purpose: `jalaliParts` reads the local calendar
// date, and mixing that with a UTC formatter shifts dates near midnight.
const icu = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function icuParts(date: Date): { year: number; month: number; day: number } {
  const parts = icu.formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

describe("Jalaali calendar", () => {
  it("matches ICU on known boundary dates", () => {
    const dates = [
      new Date(2026, 10, 20), // 1405-08-29
      new Date(2026, 2, 21), // 1405-01-01
      new Date(2027, 2, 21), // 1406-01-01
      new Date(2024, 1, 29),
      new Date(2000, 0, 1),
    ];
    for (const date of dates) {
      expect(jalaliParts(date), date.toISOString()).toEqual(icuParts(date));
    }
  });

  it("agrees with ICU across 400 consecutive months", () => {
    const cursor = new Date(1995, 0, 1);
    for (let index = 0; index < 400; index += 1) {
      const date = new Date(cursor.getTime());
      expect(jalaliParts(date), date.toDateString()).toEqual(icuParts(date));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  });

  it("round-trips Jalaali ⇄ Gregorian", () => {
    for (let year = 1395; year <= 1410; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const date = jalaliToDate({ year, month, day: 1 });
        expect(date, `${year}-${month}`).not.toBeNull();
        const back = jalaliParts(date!);
        expect(back).toEqual({ year, month, day: 1 });
      }
    }
  });

  it("rejects impossible Jalaali dates", () => {
    expect(jalaliToDate({ year: 1405, month: 13, day: 1 })).toBeNull();
    expect(jalaliToDate({ year: 1405, month: 1, day: 32 })).toBeNull();
    expect(jalaliToDate({ year: 1405, month: 12, day: 30 })).toBeNull(); // 1405 is not leap
  });

  it("knows leap years", () => {
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(isJalaliLeapYear(1405)).toBe(false);
  });

  it("formats for each locale", () => {
    const date = new Date(2026, 10, 20);
    expect(formatJalali(date, "fa")).toBe("۲۹ آبان ۱۴۰۵");
    expect(formatJalali(date, "en")).toBe("29 Aban 1405");
    expect(formatJalaliShort(date, "fa")).toBe("۱۴۰۵/۰۸/۲۹");
    expect(formatJalaliShort(date, "en")).toBe("1405-08-29");
  });

  it("computes the Jalaali year range", () => {
    const { from, to } = jalaliYearRange(new Date(2026, 10, 20));
    expect(jalaliParts(from)).toEqual({ year: 1405, month: 1, day: 1 });
    expect(jalaliParts(to)).toEqual({ year: 1405, month: 12, day: 29 });
  });
});

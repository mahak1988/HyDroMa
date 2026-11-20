import { describe, expect, it } from "vitest";
import {
  addMoney,
  formatMeasurement,
  formatMoney,
  hasMinorUnit,
  isCurrencyCode,
  isIso4217Currency,
  isMoney,
  ISO_MINOR_UNITS,
  minorDigits,
  multiplyMoney,
  NO_MINOR_UNIT_CODES,
  sumMoney,
  toMajor,
  toMajorString,
  toMinor,
  toMinorExact,
  ZERO_MINOR_UNIT_CODES,
} from "../src/money";

describe("minorDigits", () => {
  it("knows the demo currencies", () => {
    // IRR is 2 per ISO 4217 (SIX List One, published 2026-09-17). It was
    // previously asserted as 0, which was the defect this table corrects.
    expect(minorDigits("IRR")).toBe(2);
    expect(minorDigits("USD")).toBe(2);
    expect(minorDigits("EUR")).toBe(2);
  });

  it("defaults unknown currencies to 2", () => {
    expect(minorDigits("XYZ")).toBe(2);
  });

  it("is case-insensitive for lookup", () => {
    expect(minorDigits("irr")).toBe(2);
    expect(minorDigits("bhd")).toBe(3);
    expect(minorDigits("jpy")).toBe(0);
  });
});

describe("isCurrencyCode / isMoney", () => {
  it("accepts three-letter codes only", () => {
    expect(isCurrencyCode("IRR")).toBe(true);
    expect(isCurrencyCode("IR")).toBe(false);
    expect(isCurrencyCode("IRRR")).toBe(false);
    expect(isCurrencyCode(123)).toBe(false);
  });

  it("rejects a float amount of record", () => {
    expect(isMoney({ amountMinor: 10.5, currency: "USD" })).toBe(false);
  });

  it("rejects a non-integer and an unknown shape", () => {
    expect(isMoney({ amountMinor: Number.NaN, currency: "USD" })).toBe(false);
    expect(isMoney(null)).toBe(false);
    expect(isMoney({ amountMinor: 100 })).toBe(false);
  });

  it("accepts a well-formed amount", () => {
    expect(isMoney({ amountMinor: 100, currency: "USD" })).toBe(true);
  });
});

describe("toMajor / toMinor", () => {
  it("round-trips through minor units", () => {
    expect(toMinor(toMajor(12_345, "USD"), "USD")).toBe(12_345);
    // 500 minor units of a zero-decimal currency is 500 major units.
    expect(toMajor(500, "JPY")).toBe(500);
    // 500 minor units of IRR (2 digits) is 5.00 major units.
    expect(toMajor(500, "IRR")).toBe(5);
    expect(toMinor(5, "IRR")).toBe(500);
  });
});

describe("F-10: ISO 4217 minor digits", () => {
  it("reports three digits for the three-decimal currencies", () => {
    for (const currency of ["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]) {
      expect(minorDigits(currency), currency).toBe(3);
    }
  });

  it("keeps zero- and two-decimal currencies unchanged", () => {
    for (const currency of ["JPY", "KRW", "CLP", "ISK", "BIF", "VND"]) expect(minorDigits(currency)).toBe(0);
    for (const currency of ["USD", "EUR", "GBP", "AED", "SAR", "TRY"]) expect(minorDigits(currency)).toBe(2);
  });

  it("classifies IRR as two-decimal, matching ISO 4217", () => {
    expect(minorDigits("IRR")).toBe(2);
    expect(isIso4217Currency("IRR")).toBe(true);
    expect(hasMinorUnit("IRR")).toBe(true);
  });

  it("distinguishes zero minor units from minor units not applicable", () => {
    // Zero: a real currency with no minor unit.
    expect(minorDigits("JPY")).toBe(0);
    expect(hasMinorUnit("JPY")).toBe(true);
    // Not applicable: funds, drawing rights, metals, testing, no-currency.
    for (const code of ["XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XDR", "XPD", "XPT", "XSU", "XTS", "XUA", "XXX"]) {
      expect(hasMinorUnit(code), code).toBe(false);
      expect(isIso4217Currency(code), code).toBe(true);
      // Rendering still works and never throws.
      expect(typeof minorDigits(code)).toBe("number");
    }
  });

  it("does not treat an unknown code as a verified ISO currency", () => {
    // `Intl` would accept these; the ISO list does not contain them.
    expect(isIso4217Currency("XYZ")).toBe(false);
    expect(isIso4217Currency("ZZZ")).toBe(false);
    expect(isIso4217Currency("US")).toBe(false);
    expect(isIso4217Currency("DOLLARS")).toBe(false);
    expect(isIso4217Currency(undefined as unknown as string)).toBe(false);
    expect(hasMinorUnit("XYZ")).toBe(false);
    // Rendering still degrades safely.
    expect(() => minorDigits("XYZ")).not.toThrow();
    expect(minorDigits("XYZ")).toBe(2);
  });

  it("does not display one whole unit of a three-decimal currency as one hundredth", () => {
    // Acceptance criterion: 1.000 BHD must not render as 0.01.
    // (Intl separates the code and the amount with a non-breaking space.)
    expect(toMajor(1, "BHD")).toBe(0.001);
    expect(toMajorString(1, "BHD")).toBe("0.001");
    expect(formatMoney({ amountMinor: 1, currency: "BHD" }, "en-US")).toMatch(/^BHD\s0\.001$/);
    expect(toMinorExact("0.001", "BHD")).toBe(1);
    expect(toMinorExact("1", "BHD")).toBe(1000);
  });

  it("renders an exact major string for zero and two-decimal currencies", () => {
    expect(toMajorString(1234, "USD")).toBe("12.34");
    expect(toMajorString(500, "JPY")).toBe("500");
    // IRR has two minor units: 500 minor units render as 5.00.
    expect(toMajorString(500, "IRR")).toBe("5.00");
    expect(toMajorString(1, "IRR")).toBe("0.01");
    expect(toMajorString(-1, "USD")).toBe("-0.01");
    expect(toMajorString(0, "USD")).toBe("0.00");
  });

  it("covers four-decimal ISO 4217 codes", () => {
    expect(minorDigits("CLF")).toBe(4);
    expect(minorDigits("UYW")).toBe(4);
    expect(toMajorString(1, "CLF")).toBe("0.0001");
  });

  it("covers every ISO 4217 minor-unit group", () => {
    expect(ZERO_MINOR_UNIT_CODES.has("JPY")).toBe(true);
    expect(ZERO_MINOR_UNIT_CODES.has("IRR")).toBe(false);
    expect(NO_MINOR_UNIT_CODES.has("XAU")).toBe(true);
    // 165 codes carry a numeric minor unit, 13 have none: 178 current ISO 4217 codes.
    expect(Object.keys(ISO_MINOR_UNITS)).toHaveLength(165);
    expect(NO_MINOR_UNIT_CODES.size).toBe(13);
    expect(Object.keys(ISO_MINOR_UNITS).length + NO_MINOR_UNIT_CODES.size).toBe(178);
  });

  it("falls back to two digits for an unknown but well-formed code", () => {
    expect(minorDigits("XYZ")).toBe(2);
  });

  it("falls back to two digits for a malformed code instead of throwing", () => {
    expect(minorDigits("US")).toBe(2);
    expect(minorDigits("")).toBe(2);
    expect(minorDigits("DOLLARS")).toBe(2);
  });

  it("round-trips every supported precision", () => {
    for (const currency of ["BHD", "USD", "JPY"]) {
      for (const amount of [0, 1, 999, 1_000_000]) {
        expect(toMinorExact(toMajorString(amount, currency), currency)).toBe(amount);
      }
    }
  });
});

describe("F-10 (regression): IRR is a two-decimal currency", () => {
  // Authority: SIX Group ISO 4217 List One, published 2026-09-17, entry
  // "IRAN (ISLAMIC REPUBLIC OF) / Iranian Rial / 364 / 2".
  // ICU/CLDR reports 0 for IRR; that disagreement is exactly why the table exists.
  it("reports two minor units", () => {
    expect(minorDigits("IRR")).toBe(2);
  });

  it("converts one minor unit to 0.01 major units", () => {
    expect(toMajor(1, "IRR")).toBe(0.01);
    expect(toMajor(100, "IRR")).toBe(1);
    expect(toMinor(1, "IRR")).toBe(100);
  });

  it("renders one minor unit exactly, without a float", () => {
    expect(toMajorString(1, "IRR")).toBe("0.01");
    expect(toMajorString(100, "IRR")).toBe("1.00");
  });

  it("formats one IRR minor unit at the correct scale", () => {
    // Must contain 0.01 — not 1 (the old zero-decimal rendering).
    const oneMinor = formatMoney({ amountMinor: 1, currency: "IRR" }, "en-US");
    expect(oneMinor).toMatch(/0\.01/);
    expect(oneMinor).not.toMatch(/IRR\s1\s*$/);

    const hundredMinor = formatMoney({ amountMinor: 100, currency: "IRR" }, "en-US");
    expect(hundredMinor).toMatch(/1\.00/);
  });

  it("keeps three-decimal currencies unaffected", () => {
    expect(minorDigits("BHD")).toBe(3);
    expect(toMajorString(1, "BHD")).toBe("0.001");
    expect(toMinorExact("1", "BHD")).toBe(1000);
  });
});

describe("F-09: decimal-exact toMinor", () => {
  it("rounds half-up on the decimal literal, not on the float product", () => {
    expect(toMinor(1.005, "USD")).toBe(101);
    expect(toMinor(0.145, "USD")).toBe(15);
    expect(toMinor(2.675, "USD")).toBe(268);
  });

  it("keeps values that are already exact", () => {
    expect(toMinor(1.0049, "USD")).toBe(100);
    expect(toMinor(1.004, "USD")).toBe(100);
    expect(toMinor(1.006, "USD")).toBe(101);
  });

  it("handles negatives symmetrically", () => {
    expect(toMinor(-1.005, "USD")).toBe(-101);
    expect(toMinor(-0.145, "USD")).toBe(-15);
    expect(toMinor(-1.0049, "USD")).toBe(-100);
  });

  it("handles zero without producing negative zero", () => {
    expect(toMinor(0, "USD")).toBe(0);
    expect(Object.is(toMinor(-0, "USD"), -0)).toBe(false);
    expect(toMinorExact("0", "USD")).toBe(0);
    expect(toMinorExact("-0.000", "USD")).toBe(0);
  });

  it("accepts excess precision without losing the rounded result", () => {
    expect(toMinorExact("1.005000", "USD")).toBe(101);
    expect(toMinorExact("1.0049999", "USD")).toBe(100);
  });

  it("respects zero-decimal currencies", () => {
    expect(toMinorExact("1.2", "JPY")).toBe(1);
    expect(toMinorExact("1.5", "JPY")).toBe(2);
    expect(toMinorExact("1.4", "JPY")).toBe(1);
  });

  it("expands exponential notation", () => {
    expect(toMinorExact("1e3", "USD")).toBe(100000);
    expect(toMinorExact("1.5e+2", "USD")).toBe(15000);
    expect(toMinor(1e-7, "USD")).toBe(0);
    expect(toMinor(1e2, "USD")).toBe(10000);
  });

  it("rejects non-finite numbers", () => {
    expect(() => toMinor(Number.NaN, "USD")).toThrow(RangeError);
    expect(() => toMinor(Number.POSITIVE_INFINITY, "USD")).toThrow(RangeError);
  });

  it("rejects malformed decimal strings", () => {
    for (const input of ["", "abc", "1.2.3", "--1", "1,5"]) {
      expect(() => toMinorExact(input, "USD"), input).toThrow(RangeError);
    }
  });

  it("rejects results outside the safe-integer range", () => {
    // 1e21 USD is 1e23 minor units — far beyond Number.MAX_SAFE_INTEGER.
    expect(() => toMinor(1e21, "USD")).toThrow(RangeError);
    expect(() => toMinorExact("1000000000000000", "USD")).toThrow(RangeError);
  });

  it("accepts the largest safely representable minor amount", () => {
    // Use a zero-decimal currency so the value is not scaled out of range.
    expect(toMinor(Number.MAX_SAFE_INTEGER, "JPY")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("documents the precision limit: a number is the shortest round-trip decimal", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in binary; the literal form governs.
    expect(toMinor(0.1 + 0.2, "USD")).toBe(30);
  });
});

describe("formatMoney", () => {
  it("formats a valid amount", () => {
    expect(formatMoney({ amountMinor: 12_345, currency: "USD" }, "en-US")).toBe("$123.45");
  });

  it("returns an em dash for invalid input instead of a misleading number", () => {
    expect(formatMoney(null, "en-US")).toBe("—");
    expect(formatMoney(undefined, "en-US")).toBe("—");
    expect(formatMoney({ amountMinor: 1.5, currency: "USD" }, "en-US")).toBe("—");
    expect(formatMoney({ amountMinor: 100, currency: "ZZ" }, "en-US")).toBe("—");
  });
});

describe("multiplyMoney / addMoney / sumMoney", () => {
  it("multiplies and rounds to a whole minor unit", () => {
    expect(multiplyMoney({ amountMinor: 333, currency: "USD" }, 3)).toEqual({ amountMinor: 999, currency: "USD" });
    expect(multiplyMoney({ amountMinor: 10, currency: "USD" }, 0.5)).toEqual({ amountMinor: 5, currency: "USD" });
  });

  it("refuses to add different currencies", () => {
    expect(() => addMoney({ amountMinor: 1, currency: "USD" }, { amountMinor: 1, currency: "EUR" })).toThrow(
      /different currencies/,
    );
  });

  it("sums same-currency amounts", () => {
    expect(
      sumMoney([
        { amountMinor: 100, currency: "USD" },
        { amountMinor: 250, currency: "USD" },
      ]),
    ).toEqual({ amountMinor: 350, currency: "USD" });
  });

  it("returns null for mixed currencies and for an empty list", () => {
    expect(
      sumMoney([
        { amountMinor: 1, currency: "USD" },
        { amountMinor: 1, currency: "EUR" },
      ]),
    ).toBeNull();
    expect(sumMoney([])).toBeNull();
  });
});

describe("formatMeasurement", () => {
  it("appends the unit without altering precision", () => {
    expect(formatMeasurement(28.4567, "mm", "en-US", 2)).toBe("28.46 mm");
    expect(formatMeasurement(28, "mm", "en-US")).toBe("28 mm");
  });

  it("returns an em dash for non-finite values", () => {
    expect(formatMeasurement(Number.NaN, "mm", "en-US")).toBe("—");
    expect(formatMeasurement(Number.POSITIVE_INFINITY, "mm", "en-US")).toBe("—");
  });
});
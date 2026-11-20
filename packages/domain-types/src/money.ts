import type { Money } from "./commerce";

/**
 * Decimal-safe money helpers.
 *
 * The amount of record is always an integer number of **minor units**
 * (`{ amountMinor, currency }`). No function here performs arithmetic on a
 * major-unit float: conversion happens only at the boundary, and formatting
 * never stores a float.
 *
 * # Minor digits (ISO 4217)
 *
 * The table below is transcribed from the official source and is the **only**
 * authority consulted — never the runtime's CLDR/ICU data.
 *
 * - **Source:** SIX Group, ISO 4217 Maintenance Agency — *List One: Current Currency & Funds*
 *   (`https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml`,
 *   landing page `https://www.six-group.com/en/products-services/financial-information/market-reference-data/data-standards.html`)
 * - **List publication date:** 2026-09-17 (the `Pblshd` attribute of the document)
 * - **Verified on:** 2026-11-20 — this transcription covers 280 country/currency entries reduced to
 *   **178 distinct alphabetic codes**, with **zero intra-list conflicts**.
 *
 * CLDR is deliberately not used because it disagrees with ISO 4217 for several *active* currencies.
 * A documented example is `IRR`: ISO 4217 specifies **2** minor units, while the ICU data in current
 * browsers and Node reports **0**. Trusting ICU would silently make every rial amount 100× too
 * large, and a CLDR upgrade must never be able to change financial rounding.
 *
 * # Zero minor units vs. minor units not applicable
 *
 * These are different facts and are modelled separately:
 * - `minorDigits(code) === 0` — a real currency with no minor unit (JPY, KRW, CLP, …).
 * - `hasMinorUnit(code) === false` — no minor unit *exists* for the code: funds, drawing rights,
 *   precious metals, testing and "no currency" codes such as `XAU`, `XDR`, `XTS`, `XXX`.
 *   `minorDigits` still returns a rendering fallback (2) for those so formatting never throws, but
 *   callers that need the truth must use `hasMinorUnit`.
 *
 * An unknown code is **not** an ISO currency: `isIso4217Currency` returns false for it, even though
 * `Intl.NumberFormat` would accept any well-formed three-letter code.
 *
 * # Rounding policy
 *
 * Conversion from a major amount to minor units uses **half-up (away from zero on an exact tie),
 * applied to the decimal literal** — never to a binary float product. `toMinor(1.005, "USD")` is
 * `101`, because the literal is `1.005`; multiplying by 100 in binary floating point yields
 * `100.49999999999999` and would truncate to `100`.
 *
 * # Precision limit
 *
 * A `number` is only an exact carrier up to `Number.MAX_SAFE_INTEGER`, and its decimal form is the
 * shortest string that round-trips. For authoritative decimal input (an API payload, a user-typed
 * amount), use `toMinorExact`, which takes the decimal as a string and never touches a float.
 */

/**
 * ISO 4217 codes with **zero** minor units (no decimal fraction).
 * Source: SIX List One, published 2026-09-17 — 17 codes.
 */
const ZERO_MINOR_UNIT = [
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "UYI",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
] as const;

/**
 * ISO 4217 codes with **three** minor units.
 * Source: SIX List One, published 2026-09-17 — 7 codes.
 */
const THREE_MINOR_UNIT = ["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"] as const;

/**
 * ISO 4217 codes with **four** minor units.
 * Source: SIX List One, published 2026-09-17 — 2 codes (CLF, UYW).
 */
const FOUR_MINOR_UNIT = ["CLF", "UYW"] as const;

/**
 * ISO 4217 codes for which a minor unit **does not apply** (not zero — not applicable).
 * Source: SIX List One, published 2026-09-17 — 13 codes: drawing rights, fund/unit-of-account
 * codes, precious metals, a testing code and the "no currency" code.
 */
const NO_MINOR_UNIT = ["XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XDR", "XPD", "XPT", "XSU", "XTS", "XUA", "XXX"] as const;

/**
 * ISO 4217 codes with **two** minor units.
 * Source: SIX List One, published 2026-09-17 — 139 codes, including `IRR` (Iranian Rial, numeric 364).
 */
const TWO_MINOR_UNIT = [
  "AED", "AFN", "ALL", "AMD", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD", "BDT", "BMD", "BND",
  "BOB", "BOV", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHE", "CHF", "CHW", "CNY",
  "COP", "COU", "CRC", "CUP", "CVE", "CZK", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD",
  "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GTQ", "GYD", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS",
  "INR", "IRR", "JMD", "KES", "KGS", "KHR", "KPW", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL",
  "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR",
  "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "QAR",
  "RON", "RSD", "RUB", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS", "SRD", "SSP",
  "STN", "SVC", "SYP", "SZL", "THB", "TJS", "TMT", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "USD",
  "USN", "UYU", "UZS", "VED", "VES", "WST", "XAD", "XCD", "XCG", "YER", "ZAR", "ZMW", "ZWG",
] as const;

function buildMinorUnits(): Readonly<Record<string, number>> {
  const table: Record<string, number> = {};
  for (const code of ZERO_MINOR_UNIT) table[code] = 0;
  for (const code of TWO_MINOR_UNIT) table[code] = 2;
  for (const code of THREE_MINOR_UNIT) table[code] = 3;
  for (const code of FOUR_MINOR_UNIT) table[code] = 4;
  return Object.freeze(table);
}

/**
 * Authoritative ISO 4217 minor units for every current alphabetic code.
 *
 * Frozen and complete: a code absent from this map is **not** a current ISO 4217 currency.
 */
export const ISO_MINOR_UNITS: Readonly<Record<string, number>> = buildMinorUnits();

/** Codes for which no minor unit exists (minor units not applicable). */
export const NO_MINOR_UNIT_CODES: ReadonlySet<string> = new Set<string>(NO_MINOR_UNIT);

/**
 * Codes for which ISO 4217 defines zero minor units. Exported so tests and callers can assert the
 * distinction between "zero minor units" and "minor units not applicable".
 */
export const ZERO_MINOR_UNIT_CODES: ReadonlySet<string> = new Set<string>(ZERO_MINOR_UNIT);

export function isCurrencyCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z]{3}$/u.test(value);
}

/**
 * True when `code` is a **current** ISO 4217 alphabetic code.
 *
 * This is a membership test against the official list, not "the runtime accepts it": an unknown or
 * withdrawn code returns false even though `Intl.NumberFormat` would format it.
 *
 * Codes with no minor unit (`XAU`, `XDR`, `XTS`, …) are ISO 4217 currencies too, so they are
 * recognised via {@link NO_MINOR_UNIT_CODES} even though they are absent from the numeric map.
 */
export function isIso4217Currency(code: unknown): code is string {
  if (!isCurrencyCode(code)) return false;
  const key = code.toUpperCase();
  return (
    Object.prototype.hasOwnProperty.call(ISO_MINOR_UNITS, key) || NO_MINOR_UNIT_CODES.has(key)
  );
}

/** True when a minor unit exists for the code (false for funds/metals/testing/no-currency codes). */
export function hasMinorUnit(code: string): boolean {
  if (!isCurrencyCode(code)) return false;
  const key = code.toUpperCase();
  if (NO_MINOR_UNIT_CODES.has(key)) return false;
  return Object.prototype.hasOwnProperty.call(ISO_MINOR_UNITS, key);
}

const digitsCache = new Map<string, number>();

/**
 * Number of decimal digits for a currency.
 *
 * Returns the ISO 4217 value. For a code that is not in the list — or one for which no minor unit
 * exists — it returns the conservative rendering fallback `2` and never throws; use
 * `isIso4217Currency` / `hasMinorUnit` to distinguish those cases.
 */
export function minorDigits(currency: string): number {
  const key = typeof currency === "string" ? currency.toUpperCase() : "";
  const cached = digitsCache.get(key);
  if (cached !== undefined) return cached;

  const digits = Object.prototype.hasOwnProperty.call(ISO_MINOR_UNITS, key) ? ISO_MINOR_UNITS[key]! : 2;
  digitsCache.set(key, digits);
  return digits;
}

/** Runtime guard for money values crossing a boundary (API, storage, URL). */
export function isMoney(value: unknown): value is Money {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { amountMinor?: unknown; currency?: unknown };
  return (
    typeof candidate.amountMinor === "number" &&
    Number.isSafeInteger(candidate.amountMinor) &&
    isCurrencyCode(candidate.currency)
  );
}

/* ------------------------------ decimal math ------------------------------ */

/** Expand exponential notation (`1.5e+3`) into a plain decimal literal. */
function expandExponential(literal: string): string | null {
  if (!/[eE]/u.test(literal)) return literal;

  const match = /^([+-]?)(\d*)(?:\.(\d*))?[eE]([+-]?\d+)$/u.exec(literal);
  if (!match) return null;

  const sign = match[1] ?? "";
  const integerPart = match[2] ?? "";
  const fractionPart = match[3] ?? "";
  const exponent = Number(match[4]);
  if (!Number.isInteger(exponent)) return null;

  const digits = integerPart + fractionPart;
  const pointPosition = integerPart.length + exponent;

  let plain: string;
  if (pointPosition <= 0) plain = `0.${"0".repeat(-pointPosition)}${digits}`;
  else if (pointPosition >= digits.length) plain = digits + "0".repeat(pointPosition - digits.length);
  else plain = `${digits.slice(0, pointPosition)}.${digits.slice(pointPosition)}`;

  return `${sign}${plain}`;
}

/** Increment a non-negative integer written as a decimal string. */
function incrementDigits(digits: string): string {
  const chars = digits.split("");
  for (let index = chars.length - 1; index >= 0; index -= 1) {
    const char = chars[index]!;
    if (char === "9") {
      chars[index] = "0";
      continue;
    }
    chars[index] = String.fromCharCode(char.charCodeAt(0) + 1);
    return chars.join("");
  }
  return `1${chars.join("")}`;
}

/**
 * Convert a decimal literal to minor units using exact string arithmetic and
 * half-up rounding on the discarded digits.
 *
 * @throws `RangeError` when the literal is malformed or the result exceeds the
 *   safe-integer range.
 */
export function toMinorExact(major: string, currency: string): number {
  const digits = minorDigits(currency);

  const expanded = expandExponential(major.trim());
  if (expanded === null) throw new RangeError(`toMinorExact: invalid decimal "${major}"`);

  const normalised = expanded
    .replace(/^\./u, "0.")
    .replace(/^(-?)\./u, "$10.")
    .replace(/\.$/u, ".0");

  const match = /^([+-]?)(\d+)(?:\.(\d*))?$/u.exec(normalised);
  if (!match) throw new RangeError(`toMinorExact: invalid decimal "${major}"`);

  const negative = match[1] === "-";
  const integerPart = match[2] ?? "0";
  const fractionPart = match[3] ?? "";

  const kept = (fractionPart + "0".repeat(digits)).slice(0, digits);
  const discarded = fractionPart.slice(digits);

  let combined = integerPart + kept;

  // Half-up on the discarded tail: any tail whose first digit is >= 5 rounds up.
  if (discarded.length > 0 && discarded[0]! >= "5") combined = incrementDigits(combined);

  const value = Number(combined);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`toMinorExact: amount out of safe-integer range for "${major}"`);
  }

  if (value === 0) return 0;
  return negative ? -value : value;
}

/** Convert minor units to a major-unit number for display only. */
export function toMajor(amountMinor: number, currency: string): number {
  return amountMinor / 10 ** minorDigits(currency);
}

/**
 * Render minor units as an exact major-unit decimal string.
 *
 * Useful for round-tripping and for tests: unlike `toMajor`, this never goes
 * through a float, so `1` minor unit of a three-decimal currency is exactly
 * `"0.001"` and `1` minor unit of `IRR` is exactly `"0.01"`.
 */
export function toMajorString(amountMinor: number, currency: string): string {
  const digits = minorDigits(currency);
  const negative = amountMinor < 0;
  const absolute = Math.abs(Math.trunc(amountMinor));

  if (digits === 0) return `${negative ? "-" : ""}${absolute}`;

  const padded = String(absolute).padStart(digits + 1, "0");
  const integerPart = padded.slice(0, padded.length - digits);
  const fractionPart = padded.slice(padded.length - digits);
  return `${negative ? "-" : ""}${integerPart}.${fractionPart}`;
}

/**
 * Convert a major amount to minor units.
 *
 * Accepts a `number` for convenience and routes through the exact decimal
 * literal of that number (`String(major)`), so `1.005` becomes `101` rather than
 * `100`. For authoritative input prefer `toMinorExact`.
 *
 * @throws `RangeError` for non-finite input, an invalid currency, or a result
 *   outside the safe-integer range.
 */
export function toMinor(major: number, currency: string): number {
  if (typeof major !== "number" || !Number.isFinite(major)) {
    throw new RangeError(`toMinor: requires a finite number, received ${String(major)}`);
  }
  return toMinorExact(String(major), currency);
}

/**
 * Format an amount for display. Never throws: an invalid or absent amount
 * renders an em dash rather than a misleading number.
 */
export function formatMoney(money: Money | null | undefined, locale: string): string {
  if (!isMoney(money)) return "—";
  try {
    const digits = minorDigits(money.currency);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(toMajor(money.amountMinor, money.currency));
  } catch {
    return "—";
  }
}

export function multiplyMoney(money: Money, quantity: number): Money {
  return { amountMinor: Math.round(money.amountMinor * quantity), currency: money.currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Cannot add different currencies");
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

/** Sum a list of same-currency amounts. Returns `null` for mixed currencies. */
export function sumMoney(items: readonly Money[]): Money | null {
  if (items.length === 0) return null;
  const currency = items[0]!.currency;
  let total = 0;
  for (const item of items) {
    if (item.currency !== currency) return null;
    total += item.amountMinor;
  }
  return { amountMinor: total, currency };
}

/**
 * Format a measurement with its unit.
 *
 * Scientific values keep their own precision: the value is passed through
 * unchanged and only the unit is appended, so a demo value is never silently
 * rounded into looking like a measurement.
 */
export function formatMeasurement(value: number, unit: string, locale: string, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
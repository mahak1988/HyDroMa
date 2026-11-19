import type { Money } from "@eco-nojin/domain-types";

/** ISO 4217 minor-unit digits used by the demo catalogue. */
const MINOR_DIGITS: Record<string, number> = { EUR: 2, USD: 2, IRR: 0 };

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency] ?? 2;
}

/** Format minor units without ever treating a float as the amount of record. */
export function formatMoney(money: Money, locale: string): string {
  const digits = minorDigits(money.currency);
  const major = money.amountMinor / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
}

export function multiplyMoney(money: Money, quantity: number): Money {
  return { amountMinor: Math.round(money.amountMinor * quantity), currency: money.currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Cannot add different currencies");
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}
import { describe, expect, it } from "vitest";
import type { Money } from "@eco-nojin/domain-types";
import { formatMoney } from "../../src/lib/money";

const valid: Money = { amountMinor: 8_400_000, currency: "IRR" };

describe("formatMoney", () => {
  it("formats valid minor units at the ISO 4217 scale for IRR (2 digits)", () => {
    // IRR has 2 minor units per ISO 4217 (SIX List One, 2026-09-17), so
    // 8,400,000 minor units is 84,000.00 rial — not 8,400,000.
    expect(formatMoney(valid, "en")).toMatch(/84,000\.00/);
  });

  it("renders a single minor unit as 0.01", () => {
    expect(formatMoney({ amountMinor: 1, currency: "IRR" }, "en")).toMatch(/0\.01/);
  });

  it("returns a safe fallback for null or malformed money", () => {
    const invalid = [
      null,
      undefined,
      {} as Money,
      { amountMinor: Number.NaN, currency: "IRR" },
      { amountMinor: Number.POSITIVE_INFINITY, currency: "IRR" },
      { amountMinor: 100, currency: "US" },
      { amountMinor: 100, currency: "USDD" },
      { amountMinor: "100", currency: "IRR" } as unknown as Money,
    ];
    for (const value of invalid) {
      expect(() => formatMoney(value, "en")).not.toThrow();
      expect(formatMoney(value, "en")).toBe("—");
    }
  });
});
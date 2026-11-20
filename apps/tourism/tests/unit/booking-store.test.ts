import { describe, expect, it } from "vitest";
import { isBookingRequest, parseBookings } from "../../src/lib/booking-store";

const base = {
  id: "req-1",
  kind: "stay",
  targetId: "stay-kondor-homestay",
  startDate: "2026-06-01",
  endDate: "2026-06-03",
  guests: 2,
  status: "requested",
  quote: { amountMinor: 8_400_000, currency: "IRR" },
  createdAt: "2026-11-19T08:00:00.000Z",
  demo: true,
};

const withOverrides = (overrides: Record<string, unknown>) => ({ ...base, ...overrides });

describe("booking persistence validation", () => {
  it("accepts a complete booking unchanged", () => {
    expect(isBookingRequest(base)).toBe(true);
    const parsed = parseBookings([base]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toBe(base);
  });

  it("rejects records missing required fields", () => {
    const missing = [
      withOverrides({ demo: false }),
      withOverrides({ id: "" }),
      withOverrides({ targetId: "" }),
      withOverrides({ kind: "tour" }),
      withOverrides({ status: "unknown" }),
      withOverrides({ startDate: "" }),
      withOverrides({ endDate: "" }),
      withOverrides({ guests: 0 }),
      withOverrides({ createdAt: "" }),
      withOverrides({ quote: undefined }),
    ];
    for (const record of missing) expect(isBookingRequest(record)).toBe(false);
  });

  it("rejects invalid dates and inverted ranges", () => {
    expect(isBookingRequest(withOverrides({ startDate: "2026-6-1" }))).toBe(false);
    expect(isBookingRequest(withOverrides({ endDate: "2026-02-30" }))).toBe(false);
    expect(isBookingRequest(withOverrides({ startDate: "2026-06-05", endDate: "2026-06-01" }))).toBe(false);
  });

  it("rejects non-integer or out-of-range guest counts", () => {
    expect(isBookingRequest(withOverrides({ guests: 1.5 }))).toBe(false);
    expect(isBookingRequest(withOverrides({ guests: "2" }))).toBe(false);
    expect(isBookingRequest(withOverrides({ guests: -1 }))).toBe(false);
  });

  it("rejects invalid currency codes", () => {
    for (const currency of ["US", "USDD", "12", "", null]) {
      expect(isBookingRequest(withOverrides({ quote: { amountMinor: 100, currency } }))).toBe(false);
    }
  });

  it("rejects invalid amounts", () => {
    for (const amountMinor of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, "100", 1_000_000_000_001]) {
      expect(isBookingRequest(withOverrides({ quote: { amountMinor, currency: "IRR" } }))).toBe(false);
    }
  });

  it("filters mixed arrays and preserves valid records", () => {
    const valid = withOverrides({ id: "req-valid" });
    const parsed = parseBookings([valid, null, { ...base, id: "" }, { ...base, quote: { amountMinor: 1, currency: "US" } }]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toBe(valid);
  });

  it("returns an empty list for non-array input", () => {
    expect(parseBookings(null)).toEqual([]);
    expect(parseBookings({})).toEqual([]);
    expect(parseBookings("[]")).toEqual([]);
  });
});
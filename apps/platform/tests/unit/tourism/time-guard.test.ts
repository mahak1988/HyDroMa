import { describe, expect, it } from "vitest";
import { addDaysSafe, isValidIsoDate } from "../../../src/sections/tourism/lib/time";

describe("date guards", () => {
  it("accepts strict ISO calendar dates", () => {
    expect(isValidIsoDate("2026-06-01")).toBe(true);
    expect(isValidIsoDate("2026-02-28")).toBe(true);
  });

  it("rejects empty, partial and impossible dates", () => {
    expect(isValidIsoDate("")).toBe(false);
    expect(isValidIsoDate("2026-6-1")).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
  });

  it("addDaysSafe never throws on invalid input", () => {
    expect(() => addDaysSafe("", 1)).not.toThrow();
    expect(addDaysSafe("", 1)).toBe("");
    expect(addDaysSafe("2026-6-1", 1)).toBe("");
  });

  it("adds days to valid input", () => {
    expect(addDaysSafe("2026-06-01", 1)).toBe("2026-06-02");
    expect(addDaysSafe("2026-06-30", 1)).toBe("2026-07-01");
  });
});
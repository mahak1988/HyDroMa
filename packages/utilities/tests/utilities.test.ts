import { describe, expect, it } from "vitest";
import { addDays, clamp, daysBetween, pickLocalized, slugify, toIsoDate } from "../src";

describe("utilities", () => {
  it("resolves localisation with a regional and language fallback", () => {
    const values = { fa: "فارسی", en: "English" };
    expect(pickLocalized("fa-IR", values)).toBe("فارسی");
    expect(pickLocalized("ar-EG", values)).toBe("English");
    expect(pickLocalized("de", values, ["fa"])).toBe("فارسی");
    expect(pickLocalized("de", values, [])).toBeUndefined();
  });

  it("clamps into range and tolerates NaN", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(Number.NaN, 2, 10)).toBe(2);
  });

  it("slugifies Latin and Persian without transliteration", () => {
    expect(slugify("Karaj Watershed Council")).toBe("karaj-watershed-council");
    expect(slugify("  حوضه آبریز کرج ")).toBe("حوضه-آبریز-کرج");
    expect(slugify("a--b__c")).toBe("a-b-c");
  });

  it("formats and shifts ISO dates in UTC", () => {
    expect(toIsoDate("2026-11-20T10:30:00.000Z")).toBe("2026-11-20");
    expect(toIsoDate("not a date")).toBe("");
    expect(addDays("2026-11-20", 10)).toBe("2026-11-30");
    expect(daysBetween("2026-11-20", "2026-11-30")).toBe(10);
    expect(daysBetween("x", "2026-11-30")).toBeNull();
  });
});
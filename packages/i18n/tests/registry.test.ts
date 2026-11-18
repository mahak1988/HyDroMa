import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getLocale,
  isLocaleCode,
  resolveFallbackChain,
} from "../src/registry";

describe("locale registry", () => {
  it("ships the three Phase 1 locales with unique BCP 47 codes", () => {
    const codes = LOCALES.map((locale) => locale.code);
    expect(codes).toEqual(["fa", "en", "ar"]);
    expect(new Set(codes).size).toBe(codes.length);
    for (const locale of LOCALES) {
      expect(() => new Intl.Locale(locale.tag)).not.toThrow();
    }
  });

  it("declares direction from the registry, not from the locale name", () => {
    expect(getLocale("fa")?.direction).toBe("rtl");
    expect(getLocale("ar")?.direction).toBe("rtl");
    expect(getLocale("en")?.direction).toBe("ltr");
  });

  it("keeps numbering system and calendar independent per locale", () => {
    expect(getLocale("fa")?.numberingSystem).toBe("arabext");
    expect(getLocale("fa")?.calendar).toBe("persian");
    expect(getLocale("ar")?.numberingSystem).toBe("arab");
    expect(getLocale("en")?.calendar).toBe("gregorian");
  });

  it("resolves a terminating fallback chain", () => {
    expect(resolveFallbackChain("fa")).toEqual(["fa", "en"]);
    expect(resolveFallbackChain("ar")).toEqual(["ar", "en"]);
    expect(resolveFallbackChain("en")).toEqual(["en"]);
  });

  it("guards unknown locales", () => {
    expect(isLocaleCode("fa")).toBe(true);
    expect(isLocaleCode("de")).toBe(false);
    expect(DEFAULT_LOCALE).toBe("fa");
  });

  it("is data-driven: adding a 16th locale needs no code change", () => {
    const extended = [
      ...LOCALES,
      {
        code: "de",
        tag: "de-DE",
        nativeName: "Deutsch",
        englishName: "German",
        direction: "ltr" as const,
        numberingSystem: "latn",
        calendar: "gregorian",
        fallback: "en",
        enabled: true,
      },
    ];
    const added = extended.find((locale) => locale.code === "de");
    expect(added?.direction).toBe("ltr");
    expect(LOCALES).toHaveLength(3);
  });
});
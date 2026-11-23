import { describe, expect, it } from "vitest";
import { languageDirection, isRtlLocale } from "../src/registry";

describe("rtl direction", () => {
  it("fa and ar are rtl", () => {
    expect(languageDirection("fa")).toBe("rtl");
    expect(languageDirection("ar")).toBe("rtl");
    expect(isRtlLocale("fa")).toBe(true);
    expect(isRtlLocale("ar")).toBe(true);
  });
  it("en is ltr", () => {
    expect(languageDirection("en")).toBe("ltr");
    expect(isRtlLocale("en")).toBe(false);
  });
});
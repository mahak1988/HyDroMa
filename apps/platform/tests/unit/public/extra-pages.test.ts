import { describe, expect, it } from "vitest";
import { EXTRA_PAGES, getExtraPage, type ExtraPageKey } from "../../../src/public/content/extra";

const KEYS: ExtraPageKey[] = ["vision", "impact", "projects", "accessibility", "privacy", "terms"];

describe("extra public pages", () => {
  it("authors fa/en/ar content for every key", () => {
    for (const key of KEYS) {
      for (const locale of ["fa", "en", "ar"] as const) {
        const page = EXTRA_PAGES[locale][key];
        expect(page.title.length, `${locale}/${key} title`).toBeGreaterThan(0);
        expect(page.lead.length, `${locale}/${key} lead`).toBeGreaterThan(0);
        expect(page.blocks.length, `${locale}/${key} blocks`).toBeGreaterThan(0);
      }
    }
  });

  it("marks legal pages as drafts", () => {
    expect(EXTRA_PAGES.en.privacy.title).toMatch(/draft/i);
    expect(EXTRA_PAGES.en.terms.title).toMatch(/draft/i);
    expect(EXTRA_PAGES.en.accessibility.title).toMatch(/draft/i);
  });

  it("falls back to English for locales without authored content", () => {
    expect(getExtraPage("ko", "privacy")).toBe(EXTRA_PAGES.en.privacy);
    expect(getExtraPage("fr", "terms")).toBe(EXTRA_PAGES.en.terms);
  });
});
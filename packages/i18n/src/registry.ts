export type LocaleDirection = "ltr" | "rtl";

export type LocaleDefinition = {
  /** BCP 47 language subtag used in URLs and APIs. */
  code: string;
  /** Full BCP 47 locale used for Intl formatting. */
  tag: string;
  nativeName: string;
  englishName: string;
  direction: LocaleDirection;
  /** CLDR numbering system; drives digit shaping. */
  numberingSystem: string;
  /** Preferred calendar for display; storage stays Gregorian/UTC. */
  calendar: string;
  /** Used when a key is missing in this locale. */
  fallback: string | null;
  /** Locales are enabled per surface; a disabled locale is never served. */
  enabled: boolean;
};

/**
 * Locale registry — the single source of truth.
 *
 * Phase 1 ships three fully translated locales (fa, en, ar) for the shell scope.
 * The product must support 15 locales; the final active list is an owner decision
 * (D-I18N-09), so entries are data and adding one must not require code changes.
 */
export const LOCALES: readonly LocaleDefinition[] = [
  {
    code: "fa",
    tag: "fa-IR",
    nativeName: "فارسی",
    englishName: "Persian",
    direction: "rtl",
    numberingSystem: "arabext",
    calendar: "persian",
    fallback: "en",
    enabled: true,
  },
  {
    code: "en",
    tag: "en-US",
    nativeName: "English",
    englishName: "English",
    direction: "ltr",
    numberingSystem: "latn",
    calendar: "gregorian",
    fallback: null,
    enabled: true,
  },
  {
    code: "ar",
    tag: "ar-EG",
    nativeName: "العربية",
    englishName: "Arabic",
    direction: "rtl",
    numberingSystem: "arab",
    calendar: "gregorian",
    fallback: "en",
    enabled: true,
  },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "fa";
export const LOCALE_STORAGE_KEY = "eco.locale";

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === "string" && LOCALES.some((locale) => locale.code === value);
}

export function getLocale(code: string): LocaleDefinition | undefined {
  return LOCALES.find((locale) => locale.code === code);
}

/** Locale → fallback → … until a locale with no fallback (normally `en`). */
export function resolveFallbackChain(code: LocaleCode): LocaleCode[] {
  const chain: LocaleCode[] = [];
  let cursor: string | null = getLocale(code) ? code : DEFAULT_LOCALE;
  while (cursor && !chain.includes(cursor as LocaleCode)) {
    chain.push(cursor as LocaleCode);
    cursor = getLocale(cursor)?.fallback ?? null;
  }
  return chain;
}
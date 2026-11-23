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
  /** Lifecycle: active (served) | planned (not served) | disabled (not served). */
  status?: "active" | "planned" | "disabled";
  /** Whether the catalog is fully translated (vs fallback-only). */
  translated?: boolean;
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
    status: "active",
    translated: true,
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
    status: "active",
    translated: true,
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
    status: "active",
    translated: true,
  },
  // --- Planned locales (12) — not served until translated ---
  { code: "es", tag: "es-ES", nativeName: "Español", englishName: "Spanish", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "fr", tag: "fr-FR", nativeName: "Français", englishName: "French", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "de", tag: "de-DE", nativeName: "Deutsch", englishName: "German", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "pt", tag: "pt-BR", nativeName: "Português", englishName: "Portuguese", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "ru", tag: "ru-RU", nativeName: "Русский", englishName: "Russian", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "zh", tag: "zh-CN", nativeName: "中文", englishName: "Chinese (Simplified)", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "ja", tag: "ja-JP", nativeName: "日本語", englishName: "Japanese", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "ko", tag: "ko-KR", nativeName: "한국어", englishName: "Korean", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: false, status: "planned", translated: false },
  { code: "tr", tag: "tr-TR", nativeName: "Türkçe", englishName: "Turkish", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "it", tag: "it-IT", nativeName: "Italiano", englishName: "Italian", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "hi", tag: "hi-IN", nativeName: "हिन्दी", englishName: "Hindi", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
  { code: "id", tag: "id-ID", nativeName: "Bahasa Indonesia", englishName: "Indonesian", direction: "ltr", numberingSystem: "latn", calendar: "gregorian", fallback: "en", enabled: true, status: "active", translated: true },
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

/* ------------------------------- direction ------------------------------ */

/**
 * Right-to-left locales. Kept as data (not a code branch) so enabling a new
 * RTL locale is a registry edit, not a refactor.
 */
export const RTL_LANGUAGES: ReadonlySet<string> = new Set(["ar", "he", "fa", "ur"]);

/**
 * Resolve text direction from a language tag.
 * Unknown or empty tags fall back to `ltr`; regional subtags are ignored, so
 * `fa-IR` and `ar-EG` resolve correctly.
 */
export function languageDirection(code: string | null | undefined): LocaleDirection {
  if (!code) return "ltr";
  const base = code.toLowerCase().split(/[-_]/u)[0] ?? "";
  return RTL_LANGUAGES.has(base) ? "rtl" : "ltr";
}

/** Locales that should be mirrored (icons, chevrons, progress direction). */
export function isRtlLocale(code: string | null | undefined): boolean {
  return languageDirection(code) === "rtl";
}

/** Languages offered by the product (enabled and active), in display order. */
export function availableLocales(): LocaleDefinition[] {
  return LOCALES.filter((locale) => locale.enabled && (locale.status ?? "active") === "active");
}

/**
 * Resolve a BCP 47 tag or bare language subtag (e.g. "fa-IR", "ar", "en-US")
 * to a served locale code, or ``null`` if unsupported / not served.
 * Region/variant subtags are ignored (per languageDirection's convention).
 */
export function resolveLocale(input: string | null | undefined): LocaleCode | null {
  if (!input) return null;
  const base = input.toLowerCase().split(/[-_]/u)[0] ?? "";
  const match = LOCALES.find(
    (locale) => locale.code === base && locale.enabled && (locale.status ?? "active") === "active",
  );
  return match ? match.code : null;
}
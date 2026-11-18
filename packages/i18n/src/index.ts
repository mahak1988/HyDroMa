export { I18nProvider, useI18n, type Catalog, type I18nValue, type TranslationKey } from "./provider";
export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
  getLocale,
  isLocaleCode,
  resolveFallbackChain,
  type LocaleCode,
  type LocaleDefinition,
  type LocaleDirection,
} from "./registry";
export { ar, en, fa } from "./catalogs";
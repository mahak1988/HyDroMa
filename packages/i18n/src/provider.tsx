import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ar } from "./catalogs/ar";
import { de } from "./catalogs/de";
import { en, type Catalog, type TranslationKey } from "./catalogs/en";
import { es } from "./catalogs/es";
import { fa } from "./catalogs/fa";
import { fr } from "./catalogs/fr";
import { id } from "./catalogs/id";
import { it } from "./catalogs/it";
import { ja } from "./catalogs/ja";
import { pt } from "./catalogs/pt";
import { ru } from "./catalogs/ru";
import { tr } from "./catalogs/tr";
import { zh } from "./catalogs/zh";
import { DirectionProvider } from "./direction";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  getLocale,
  isLocaleCode,
  resolveLocale,
  type LocaleCode,
  type LocaleDirection,
} from "./registry";

const catalogs: Record<LocaleCode, Catalog> = {
  fa, en, ar, es, fr, de, pt, ru, zh, ja, tr, it, id,
  ko: en, hi: en,
};

type PluralKey = "plural.notifications";

type Formatters = {
  number: (value: number) => string;
  decimal: (value: number, digits?: number) => string;
  currency: (value: number, currency: string) => string;
  percent: (value: number) => string;
  date: (value: Date | string | number) => string;
  dateTime: (value: Date | string | number) => string;
};

type I18nValue = {
  locale: LocaleCode;
  tag: string;
  dir: LocaleDirection;
  locales: typeof LOCALES;
  setLocale: (code: LocaleCode) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  tp: (key: PluralKey, count: number) => string;
  format: Formatters;
};

const I18nContext = createContext<I18nValue | null>(null);

function detectLocale(): LocaleCode {
  // 1. explicit, persisted user choice wins
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocaleCode(stored)) return stored;
  } catch {
    // Storage can be blocked; the shell must still render.
  }
  // 2. browser language preference (base subtag, e.g. "fa-IR" -> "fa")
  if (typeof navigator !== "undefined" && navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const code = resolveLocale(lang);
      if (code) return code;
    }
  }
  // 3. default locale
  return DEFAULT_LOCALE;
}

function read(source: unknown, key: string): unknown {
  let cursor: unknown = source;
  for (const segment of key.split(".")) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: LocaleCode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale ?? detectLocale);
  const definition = getLocale(locale) ?? getLocale(DEFAULT_LOCALE)!;
  const dir: LocaleDirection = definition.direction;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    root.dataset.locale = locale;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Preference persistence is best effort.
    }
  }, [dir, locale]);

  const setLocale = useCallback((code: LocaleCode) => setLocaleState(code), []);

  const value = useMemo<I18nValue>(() => {
    const catalog = catalogs[locale];
    const number = new Intl.NumberFormat(definition.tag, { numberingSystem: definition.numberingSystem });
    const decimal = new Intl.NumberFormat(definition.tag, {
      numberingSystem: definition.numberingSystem,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const percent = new Intl.NumberFormat(definition.tag, {
      style: "percent",
      numberingSystem: definition.numberingSystem,
      maximumFractionDigits: 1,
    });
    const date = new Intl.DateTimeFormat(definition.tag, { dateStyle: "medium" });
    const dateTime = new Intl.DateTimeFormat(definition.tag, { dateStyle: "medium", timeStyle: "short" });
    const pluralRules = new Intl.PluralRules(definition.tag);

    const t = (key: TranslationKey, values?: Record<string, string | number>): string => {
      const template = read(catalog, key);
      if (typeof template !== "string") {
        if (import.meta.env.DEV) {
          throw new Error(`Missing translation: ${locale}.${key}`);
        }
        const fallback = definition.fallback ? read(catalogs[definition.fallback as LocaleCode], key) : undefined;
        return typeof fallback === "string" ? fallback : key;
      }
      return interpolate(template, values);
    };

    return {
      locale,
      tag: definition.tag,
      dir,
      locales: LOCALES,
      setLocale,
      t,
      tp: (key, count) => {
        const group = read(catalog, key) as Record<string, string> | undefined;
        const category = pluralRules.select(count);
        const template = group?.[category] ?? group?.other;
        return template
          ? interpolate(template, { count: number.format(count) })
          : number.format(count);
      },
      format: {
        number: (value) => number.format(value),
        decimal: (value, digits) =>
          digits === undefined ? decimal.format(value) : new Intl.NumberFormat(definition.tag, {
            numberingSystem: definition.numberingSystem,
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          }).format(value),
        currency: (value, currency) =>
          new Intl.NumberFormat(definition.tag, {
            style: "currency",
            currency,
            numberingSystem: definition.numberingSystem,
          }).format(value),
        percent: (value) => percent.format(value),
        date: (value) => date.format(new Date(value)),
        dateTime: (value) => dateTime.format(new Date(value)),
      },
    };
  }, [definition, dir, locale, setLocale]);

  return (
    <DirectionProvider locale={locale}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </DirectionProvider>
  );
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

export type { Catalog, Formatters, I18nValue, LocaleCode, LocaleDirection, TranslationKey };
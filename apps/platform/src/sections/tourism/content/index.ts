import { useI18n } from "@eco-nojin/i18n";
import type { LocaleCode, TourismContent } from "./types";
import { ar } from "./ar";
import { en } from "./en";
import { fa } from "./fa";

export const CONTENT: Record<LocaleCode, TourismContent> = { fa, en, ar };

export function contentFor(locale: string): TourismContent {
  return CONTENT[locale as LocaleCode] ?? en;
}

export const AR_LOCALE = "ar";

/** Tourism content for the active locale; the shared provider owns locale and direction. */
export function useTourism(): TourismContent {
  const { locale } = useI18n();
  return contentFor(locale);
}

export type { LocaleCode, TourismContent } from "./types";
import { useI18n } from "@eco-nojin/i18n";
import { contentFor } from "./index";
import type { SiteContent } from "./types";

/** Portal content for the active locale (the shared provider owns locale + direction). */
export function useSite(): SiteContent {
  const { locale } = useI18n();
  return contentFor(locale);
}
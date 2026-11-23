import type { Experience, LocalizedText, Stay } from "@eco-nojin/domain-types";

/** Pick the active locale text, falling back to English, then to an empty string. */
export function pick(text: LocalizedText | null | undefined, locale: string): string {
  if (!text) return "";
  if (locale === "fa" || locale === "ar") return text[locale] || text.en;
  return text.en;
}

/** Display name for either a stay (`name`) or an experience (`title`). */
export function targetName(target: Stay | Experience, locale: string): string {
  return "name" in target ? pick(target.name, locale) : pick(target.title, locale);
}
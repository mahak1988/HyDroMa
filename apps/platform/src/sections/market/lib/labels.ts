import type { TranslationKey } from "@eco-nojin/i18n";

const KIND_ORDER = [
  "rural-producer",
  "nomadic-community",
  "cooperative",
  "farm",
  "workshop",
  "local-business",
  "equipment-supplier",
  "service-provider",
  "tourism-operator",
] as const;

export function kindLabelKey(kind: string): TranslationKey {
  const index = KIND_ORDER.indexOf(kind as (typeof KIND_ORDER)[number]);
  return `market.kinds.kind${index + 1}` as TranslationKey;
}

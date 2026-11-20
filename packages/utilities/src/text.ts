/** Pick the best available localisation, falling back through a short chain. */
export function pickLocalized<T>(
  locale: string,
  values: Partial<Record<string, T>>,
  fallbackChain: readonly string[] = ["en"],
): T | undefined {
  const direct = values[locale];
  if (direct !== undefined) return direct;
  const base = locale.split("-")[0] ?? locale;
  const baseValue = values[base];
  if (baseValue !== undefined) return baseValue;
  for (const candidate of fallbackChain) {
    const value = values[candidate];
    if (value !== undefined) return value;
  }
  return undefined;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/** Stable, URL-safe slug; keeps Persian/Arabic letters (no transliteration). */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/gu, "-")
    .replace(/^-|-$/gu, "");
}
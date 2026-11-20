import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contrast guard for the v1.1 identity.
 *
 * The values are parsed from the same tokens.css the apps import, so the test
 * fails if a token drifts below WCAG 2.2 AA. Pairs and thresholds come from the
 * specification (normal text 4.5:1, large text 3:1).
 */
const css = readFileSync(resolve(process.cwd(), "packages/design-system/src/tokens.css"), "utf8");
const darkStart = css.indexOf(':root[data-theme="dark"]');
const lightPart = css.slice(0, darkStart);
const darkPart = css.slice(darkStart);

function tokensOf(source: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of source.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gu)) {
    map.set(match[1]!, match[2]!.toLowerCase());
  }
  return map;
}

const light = tokensOf(lightPart);
const dark = tokensOf(darkPart);

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [high, low] = a > b ? [a, b] : [b, a];
  return (high + 0.05) / (low + 0.05);
}

function get(map: Map<string, string>, name: string): string {
  const value = map.get(name);
  if (!value) throw new Error("missing token --" + name);
  return value;
}

type Pair = { fg: string; bg: string; min: number; label: string };

const LIGHT_PAIRS: Pair[] = [
  { fg: "fg", bg: "canvas", min: 4.5, label: "body text on canvas" },
  { fg: "fg", bg: "surface", min: 4.5, label: "body text on surface" },
  { fg: "fg-muted", bg: "canvas", min: 4.5, label: "secondary text on canvas" },
  { fg: "primary", bg: "canvas", min: 4.5, label: "brand text on canvas" },
  { fg: "accent", bg: "canvas", min: 4.5, label: "accent text on canvas" },
  { fg: "gold", bg: "canvas", min: 4.5, label: "premium detail on canvas" },
  { fg: "primary-fg", bg: "primary", min: 4.5, label: "label on primary button" },
  { fg: "accent-fg", bg: "accent", min: 4.5, label: "label on accent button" },
  { fg: "success", bg: "canvas", min: 4.5, label: "success text" },
  { fg: "danger", bg: "canvas", min: 4.5, label: "danger text" },
  { fg: "info", bg: "canvas", min: 4.5, label: "info text" },
  { fg: "warning", bg: "canvas", min: 4.5, label: "warning text" },
];

const DARK_PAIRS: Pair[] = [
  { fg: "fg", bg: "canvas", min: 4.5, label: "body text on dark canvas" },
  { fg: "fg", bg: "surface", min: 4.5, label: "body text on dark surface" },
  { fg: "fg-muted", bg: "canvas", min: 4.5, label: "secondary text on dark canvas" },
  { fg: "primary", bg: "canvas", min: 4.5, label: "brand text on dark canvas" },
  { fg: "primary-fg", bg: "primary", min: 4.5, label: "label on dark primary button" },
  { fg: "accent", bg: "canvas", min: 4.5, label: "accent on dark canvas" },
  { fg: "gold", bg: "canvas", min: 4.5, label: "premium detail on dark canvas" },
  { fg: "success", bg: "canvas", min: 4.5, label: "success on dark canvas" },
  { fg: "danger", bg: "canvas", min: 4.5, label: "danger on dark canvas" },
  { fg: "info", bg: "canvas", min: 4.5, label: "info on dark canvas" },
];

describe("design tokens: WCAG 2.2 AA contrast", () => {
  it("light theme pairs meet their thresholds", () => {
    for (const pair of LIGHT_PAIRS) {
      const value = ratio(get(light, pair.fg), get(light, pair.bg));
      expect(value, `${pair.label}: ${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(pair.min);
    }
  });

  it("dark theme pairs meet their thresholds", () => {
    for (const pair of DARK_PAIRS) {
      const value = ratio(get(dark, pair.fg), get(dark, pair.bg));
      expect(value, `${pair.label}: ${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(pair.min);
    }
  });

  it("keeps the brand identity colours exactly as specified", () => {
    expect(light.get("brand-primary")).toBe("#5a3d50");
    expect(light.get("brand-accent")).toBe("#9c4f3b");
    expect(light.get("brand-secondary")).toBe("#8a6937");
    expect(light.get("brand-ivory")).toBe("#f7f2e9");
    expect(dark.get("primary")).toBe("#c59aae");
    expect(dark.get("accent")).toBe("#d28b72");
  });
});

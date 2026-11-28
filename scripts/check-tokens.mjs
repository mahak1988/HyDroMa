// Design-token guard.
// Rules:
//  1. Component code must not use raw Tailwind palette colours (bg-red-500, text-slate-200, …).
//     Those bypass the design system and break dark mode and brand theming.
//  2. Component code must not set raw hex colours in className (`bg-[#ff0000]`).
//  3. Inline `style={{ color: ... }}` with a hex literal is a violation; CSS variables are fine.
//  4. The legacy "Path A" palette must not leak outside its documented legacy
//     locations: the design-system brand folder, the brand identity exploration
//     SVGs, and this guard's own fixtures/tests.
// Usage: node scripts/check-tokens.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGETS = [
  "apps/home/src",
  "apps/brand/src",
  "apps/platform/src",
  "apps/console/src",
  "apps/portal/src",
  "apps/scientific-workspace/src",
  "apps/marketplace/src",
  "apps/tourism/src",
  "packages/ui/src",
  "packages/app-shell/src",
];

// Source and asset formats that can carry a colour. Binary assets are never read.
const SCANNABLE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|json|svg|html)$/u;

// Tailwind's default palette names. `accent-primary` and friends are fine.
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PALETTE_RE = new RegExp(`\\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|decoration|accent|caret)-(${PALETTE})-\\d{2,3}\\b`);

// Legacy "Path A" teal/coral palette plus its full shade set from the legacy
// design-system brand tokens. Pure white is intentionally excluded.
const LEGACY_COLORS = [
  "0A3F49", "0B5563", "0E7C8C", "0F1E24", "0F2A47", "173B63", "1F2933",
  "1F4A78", "2E3A87", "2E6FD6", "2E9E5B", "35C4D7", "5A6B72", "8A97A0",
  "B53030", "C9553A", "C9A227", "C9A34A", "D5DDE0", "D64545", "D9682B",
  "D98A1F", "E2D9CB", "E76F51", "F5F7F8", "F7F3EC", "FBF7F0", "FFFDFC",
];
const LEGACY_PALETTE_RE = new RegExp(`#(?:${LEGACY_COLORS.join("|")})\\b`, "i");

/**
 * Narrow, documented exceptions:
 * - `packages/design-system/src/brand/` + `brand.css`: the legacy palette itself,
 *   kept for review until the owner retires it.
 * - `apps/brand/public/`: static brand-identity exploration artwork and the
 *   generated palette showcase page, not product UI or runtime tokens.
 * - guard tests: they must contain forbidden values to test the guard.
 */
const ALLOWED_LEGACY_PATHS = [
  "packages/design-system/src/brand/",
  "packages/design-system/src/brand.css",
  "apps/brand/public/",
  "apps/platform/tests/unit/integrity/token-guard.test.ts",
  "scripts/check-tokens.mjs",
  "scripts/check-tokens.test.mjs",
  "scripts/fixtures/",
];

export function isAllowedLegacyPath(rel) {
  return ALLOWED_LEGACY_PATHS.some((prefix) => rel === prefix || rel.startsWith(prefix));
}

/** Pure, testable check for legacy palette usage in one file's text. */
export function legacyViolations(rel, text) {
  if (isAllowedLegacyPath(rel)) return [];
  const out = [];
  text.split(/\r?\n/u).forEach((line, index) => {
    if (LEGACY_PALETTE_RE.test(line)) {
      out.push(`${rel}:${index + 1} legacy palette colour → ${line.trim()}`);
    }
  });
  return out;
}

/** Pure, testable check for raw palette/hex usage in component source. */
export function styleViolations(rel, text) {
  const out = [];
  text.split(/\r?\n/u).forEach((line, index) => {
    const where = `${rel}:${index + 1}`;
    if (PALETTE_RE.test(line)) out.push(`${where} raw palette colour → ${line.trim()}`);
    if (/\[#[0-9a-fA-F]{3,8}\]/u.test(line)) out.push(`${where} hex in className → ${line.trim()}`);
    if (/(?:color|background|backgroundColor|borderColor)\s*:\s*["'`]#?[0-9a-fA-F]{3,8}/u.test(line)) {
      out.push(`${where} hex in inline style → ${line.trim()}`);
    }
  });
  return out;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "artifacts"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (SCANNABLE_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

async function main() {
  const violations = [];
  let scanned = 0;

  for (const target of TARGETS) {
    let files = [];
    try {
      files = await walk(path.join(ROOT, target));
    } catch {
      continue;
    }
    for (const file of files) {
      scanned += 1;
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      const text = await readFile(file, "utf8");
      violations.push(...styleViolations(rel, text));
    }
  }

  for (const target of ["apps", "packages", "scripts"]) {
    let files = [];
    try {
      files = await walk(path.join(ROOT, target));
    } catch {
      continue;
    }
    for (const file of files) {
      scanned += 1;
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      const text = await readFile(file, "utf8");
      violations.push(...legacyViolations(rel, text));
    }
  }

  if (violations.length > 0) {
    console.error(`Token violations: ${violations.length}`);
    for (const violation of violations.slice(0, 40)) console.error(`  ${violation}`);
    if (violations.length > 40) console.error(`  … ${violations.length - 40} more`);
    process.exitCode = 1;
  } else {
    console.log(`Tokens OK — ${scanned} files scanned across ${TARGETS.length} targets.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

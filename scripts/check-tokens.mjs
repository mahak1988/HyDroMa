// Design-token guard.
// Rules:
//  1. Component code must not use raw Tailwind palette colours (bg-red-500, text-slate-200, …).
//     Those bypass the design system and break dark mode and brand theming.
//  2. Component code must not set raw hex colours in className (`bg-[#ff0000]`).
//  3. Inline `style={{ color: ... }}` with a hex literal is a violation; CSS variables are fine.
// Usage: node scripts/check-tokens.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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

// Tailwind's default palette names. `accent-primary` and friends are fine.
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PALETTE_RE = new RegExp(`\\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|decoration|accent|caret)-(${PALETTE})-\\d{2,3}\\b`);
const HEX_CLASS_RE = /\[#[0-9a-fA-F]{3,8}\]/;
const HEX_STYLE_RE = /(?:color|background|backgroundColor|borderColor)\s*:\s*["'`]#?[0-9a-fA-F]{3,8}/;

const violations = [];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "artifacts"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let scanned = 0;
for (const target of TARGETS) {
  const root = path.join(ROOT, target);
  let files = [];
  try {
    files = await walk(root);
  } catch {
    continue;
  }
  for (const file of files) {
    scanned += 1;
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const lines = (await readFile(file, "utf8")).split(/\r?\n/u);
    lines.forEach((line, index) => {
      const where = `${rel}:${index + 1}`;
      if (PALETTE_RE.test(line)) violations.push(`${where} raw palette colour → ${line.trim()}`);
      if (HEX_CLASS_RE.test(line)) violations.push(`${where} hex in className → ${line.trim()}`);
      if (HEX_STYLE_RE.test(line)) violations.push(`${where} hex in inline style → ${line.trim()}`);
    });
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
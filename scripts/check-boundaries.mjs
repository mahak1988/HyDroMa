// Architecture boundary check.
// Rules:
//  1. A unit (app or package) may not import another unit's files (relative escapes are rejected).
//  2. Apps may not import another app by package name.
//  3. Packages may not import an app.
//  4. Nothing in the frontend tree may import engines/, services/, contracts/, upstream-registry/, experiments/.
//  5. ui and i18n may not import frontend-core (would create a cycle).
// Usage: node scripts/check-boundaries.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const UNITS = [
  "archive/legacy-console",
  "archive/legacy-scientific-workspace",
  "archive/legacy-marketplace",
  "archive/legacy-tourism",
  "apps/brand",
  "apps/platform",
  "archive/legacy-field-collection",
  "packages/design-system",
  "packages/ui",
  "packages/icons",
  "packages/i18n",
  "packages/frontend-core",
  "packages/domain-types",
  "packages/spatial",
  "packages/validation",
  "packages/api-client",
  "packages/auth-client",
  "packages/configuration",
  "packages/utilities",
  "packages/scientific",
  "packages/app-shell",
];
const APP_NAMES = ["platform", "console", "marketplace", "tourism", "scientific-workspace", "field-collection", "brand"];
const LAYER_RE = /^(engines|services|contracts|upstream-registry|upstream-archives|experiments|app)\//;

const violations = [];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "build", "out", "coverage", "artifacts", ".next", ".turbo", ".vite", "temp", "tmp"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(ts|tsx|mts|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

async function importsOf(file) {
  const text = await readFile(file, "utf8");
  const specs = [];
  const re =
    /(?:import|export)[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const spec = match[1] ?? match[2] ?? match[3];
    if (spec) specs.push(spec);
  }
  return specs;
}

let scanned = 0;
for (const unit of UNITS) {
  const unitRoot = path.join(ROOT, unit);
  const files = await walk(unitRoot);
  const unitName = unit.split("/")[1];
  const isApp = unit.startsWith("apps/") || unit.startsWith("archive/legacy-");

  for (const file of files) {
    scanned += 1;
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    for (const spec of await importsOf(file)) {
      if (spec.startsWith(".")) {
        const target = path.resolve(path.dirname(file), spec);
        const outside = path.relative(unitRoot, target);
        if (outside.startsWith("..") || path.isAbsolute(outside)) {
          violations.push({ file: rel, spec, why: "relative import escapes its unit" });
        }
        continue;
      }

      if (LAYER_RE.test(spec)) {
        violations.push({ file: rel, spec, why: "import from a non-frontend layer" });
      }

      if (spec.startsWith("@eco-nojin/")) {
        const target = spec.slice("@eco-nojin/".length).split("/")[0];
        if (isApp && APP_NAMES.includes(target) && target !== unitName) {
          violations.push({ file: rel, spec, why: "app imports another app" });
        }
        if (!isApp && APP_NAMES.includes(target)) {
          violations.push({ file: rel, spec, why: "package imports an app" });
        }
        if ((unitName === "ui" || unitName === "i18n") && target === "frontend-core") {
          violations.push({ file: rel, spec, why: "would create a package cycle" });
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Boundary violations: ${violations.length}`);
  for (const v of violations) console.error(`  ${v.file} → ${v.spec} (${v.why})`);
  process.exitCode = 1;
} else {
  console.log(`Boundaries OK — ${scanned} files across ${UNITS.length} units.`);
}

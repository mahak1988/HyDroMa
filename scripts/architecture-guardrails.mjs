// Lightweight executable architecture guardrails (Phase 3.60).
// Complements scripts/check-boundaries.mjs (which covers app/package/frontend→layer).
// Rules enforced here (the reverse directions not covered there):
//   R1 HyDroMA independence: engines/hydroma must NOT import apps/*, frontend
//      packages (@eco-nojin/*), backend (services/*), or escape its own tree.
//   R2 Backend independence: services/* must NOT import apps/*, frontend
//      packages (@eco-nojin/*), or engines/*.
// Deterministic: exit 1 on violation, 0 otherwise. No new dependencies.
// Usage: node scripts/architecture-guardrails.mjs [root]
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SKIP = new Set(["node_modules", "dist", "build", "out", "coverage", "artifacts", ".next", ".turbo", ".vite", "temp", "tmp", "tests", "__tests__"]);
const CODE_RE = /\.(ts|tsx|mts|js|mjs)$/u;
const IMPORT_RE =
  /(?:import|export)[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/gu;

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (CODE_RE.test(entry.name)) out.push(full);
  }
  return out;
}

async function importsOf(file) {
  const text = await readFile(file, "utf8");
  const specs = [];
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(text)) !== null) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (spec) specs.push(spec);
  }
  return specs;
}

const isFrontendPkg = (spec) => spec.startsWith("@eco-nojin/");
const isApp = (spec) => /^apps\//u.test(spec) || /^archive\/legacy-/u.test(spec);

async function scanTree(root, subdir, classify) {
  const base = path.join(root, subdir);
  const files = await walk(base);
  const violations = [];
  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/gu, "/");
    for (const spec of await importsOf(file)) {
      const why = classify(spec, file, base);
      if (why) violations.push({ file: rel, spec, why });
    }
  }
  return { scanned: files.length, violations };
}

function hydromaClassifier(spec, file, base) {
  if (spec.startsWith(".")) {
    const target = path.resolve(path.dirname(file), spec);
    const rel = path.relative(base, target);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return "hydroma import escapes the engine tree";
    return null;
  }
  if (isApp(spec)) return "hydroma imports an application";
  if (isFrontendPkg(spec)) return "hydroma imports a frontend package";
  if (/^services\//u.test(spec)) return "hydroma imports backend services";
  return null;
}

function backendClassifier(spec) {
  if (spec.startsWith(".")) return null; // intra-service relative imports are fine
  if (isApp(spec)) return "backend imports an application";
  if (isFrontendPkg(spec)) return "backend imports a frontend package";
  if (/^engines\//u.test(spec)) return "backend imports a scientific engine directly";
  return null;
}

export async function checkArchitecture(root) {
  const hydroma = await scanTree(root, "engines/hydroma", hydromaClassifier);
  const backend = await scanTree(root, "services", backendClassifier);
  const violations = [...hydroma.violations, ...backend.violations];
  return { scanned: hydroma.scanned + backend.scanned, violations };
}

// CLI entry.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(process.argv[2] ?? path.resolve(import.meta.dirname, ".."));
  const { scanned, violations } = await checkArchitecture(root);
  if (violations.length > 0) {
    console.error(`Architecture guardrail violations: ${violations.length}`);
    for (const v of violations) console.error(`  ${v.file} → ${v.spec} (${v.why})`);
    process.exitCode = 1;
  } else {
    console.log(`Architecture guardrails OK — ${scanned} files scanned (HyDroMA + backend independence).`);
  }
}
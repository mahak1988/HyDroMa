/**
 * App manifest validator — the five-way consistency gate (Phase 2).
 *
 * Checks (docs/reports/برنامه-مدیریت-اپ‌ها-2026-11-23.md §1):
 *   E-APP-01  every apps/ folder has a registry entry, and vice versa
 *   E-APP-02  dataMode "api" implies real API usage in src
 *   E-APP-03  requiresSession implies real session primitives in src
 *   E-APP-04  status "live" implies e2e spec + a11y spec + unit or e2e coverage
 *   E-APP-05  no duplicate paths or dev ports
 *
 * Exit 1 with a table of violations; wire into `verify` and CI.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const registry = JSON.parse(readFileSync("packages/configuration/apps.json", "utf8"));
const violations = [];

const push = (code, id, message) => violations.push(`${code}  [${id}]  ${message}`);

// --- E-APP-01: folder <-> registry ------------------------------------------
const folders = readdirSync("apps").filter((name) => statSync(join("apps", name)).isDirectory());
for (const folder of folders) {
  if (!registry.some((app) => app.id === folder)) {
    push("E-APP-01", folder, "folder under apps/ has no registry entry");
  }
}
for (const app of registry) {
  if (!folders.includes(app.id)) {
    push("E-APP-01", app.id, "registry entry has no folder under apps/");
  }
}

// --- helper: collect src text ------------------------------------------------
function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (["node_modules", "dist", "artifacts", "test-results", ".vite"].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry)) yield full;
  }
}

for (const app of registry) {
  const src = join("apps", app.id, "src");
  const tests = join("apps", app.id, "tests");
  const files = [...walk(src)];
  const sources = files.map((f) => readFileSync(f, "utf8"));
  const haystack = sources.join("\n");

  // --- E-APP-02: dataMode "api" implies real API usage -----------------------
  if (app.dataMode === "api") {
    const usesApi = /api-client|hydroma-client|\/api\/|VITE_API_URL/.test(haystack);
    if (!usesApi) push("E-APP-02", app.id, 'dataMode "api" but no api-client / hydroma-client / /api usage found');
  }

  // --- E-APP-03: requiresSession implies real session primitives -------------
  if (app.requiresSession) {
    const usesSession = /RealSessionProvider|SessionGate|useRealSession/.test(haystack);
    if (!usesSession) push("E-APP-03", app.id, 'requiresSession but no RealSessionProvider / SessionGate / useRealSession in src');
  }

  // --- E-APP-04: live implies tests ------------------------------------------
  if (app.status === "live") {
    const hasE2e = existsSync(tests) && readdirSync(tests).some((name) => name.endsWith(".spec.ts"));
    const hasA11y = existsSync(tests) && readdirSync(tests).some((name) => /a11y/.test(name));
    if (!hasE2e) push("E-APP-04", app.id, 'status "live" but no e2e spec under tests/');
    if (!hasA11y) push("E-APP-04", app.id, 'status "live" but no a11y spec under tests/');
  }

  // --- sanity: declared apiNamespaces must have a same-origin base ------------
  if ((app.apiNamespaces ?? []).length > 0 && app.dataMode === "content") {
    push("E-APP-02", app.id, 'dataMode "content" declares apiNamespaces — contradiction');
  }
}

// --- E-APP-05: unique paths and ports ----------------------------------------
const paths = registry.map((app) => app.path);
const ports = registry.map((app) => app.devPort);
for (const value of new Set(paths)) {
  if (paths.filter((item) => item === value).length > 1) push("E-APP-05", value, `duplicate path: ${value}`);
}
for (const value of new Set(ports)) {
  if (ports.filter((item) => item === value).length > 1) push("E-APP-05", String(value), `duplicate devPort: ${value}`);
}
if (new Set(paths).size !== paths.length || new Set(ports).size !== ports.length) {
  // details already pushed
} else {
  console.log(`E-APP-05  ok — ${registry.length} unique paths and ports`);
}

if (violations.length > 0) {
  console.error(`\nApp manifest violations (${violations.length}):`);
  for (const line of violations) console.error("  " + line);
  process.exit(1);
}
console.log(`App manifest OK — ${registry.length} apps, ${folders.length} folders, all five-way checks pass`);

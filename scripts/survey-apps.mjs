// Survey apps/: per-app implementation snapshot (routes, data source, tests).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const apps = JSON.parse(readFileSync("packages/configuration/apps.json", "utf8"));

function walk(dir, filter) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (["node_modules", "dist", "artifacts", "test-results", ".vite"].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, filter));
    else if (filter(entry)) out.push(full);
  }
  return out;
}

const report = [];
for (const app of apps) {
  const root = join("apps", app.id);
  const src = join(root, "src");
  const tsFiles = walk(src, (n) => /\.(ts|tsx)$/.test(n));
  const allLines = tsFiles.map((f) => readFileSync(f, "utf8"));

  const routes = new Set();
  for (const s of allLines) {
    for (const m of s.matchAll(/path:\s*"([^"]+)"/g)) routes.add(m[1]);
  }
  const pages = tsFiles.filter((f) => /pages[\\/]/.test(f) && /[Pp]age\.(tsx)$/.test(f));
  const usesApi = allLines.filter((s) => /api-client|\/api\/|VITE_API_URL|hydroma-client/.test(s));
  const usesContent = allLines.filter((s) => /content\/|usePortal\(|useTourism\(|useMarket\(|CATEGORIES|PRODUCTS|SELLERS/.test(s));
  const usesSession = allLines.filter((s) => /useRealSession|RealSessionProvider|useSession|SessionGate|useMarketSession|useTourismSession/.test(s));
  const unitTests = existsSync(join(root, "tests")) ? walk(join(root, "tests"), (n) => /\.test\.(ts|tsx)$/.test(n)) : [];
  const e2eTests = existsSync(join(root, "tests")) ? walk(join(root, "tests"), (n) => /\.(spec)\.(ts)$/.test(n)) : [];
  const a11y = e2eTests.some((f) => /a11y/.test(f));
  const hasStore = existsSync(join(src, "store")) || existsSync(join(src, "stores"));

  report.push({
    id: app.id,
    path: app.path,
    port: app.devPort,
    audience: app.audience,
    srcFiles: tsFiles.length,
    pages: pages.length,
    routeCount: routes.size,
    routes: [...routes].slice(0, 24),
    apiTouchpoints: usesApi.length,
    contentTouchpoints: usesContent.length,
    sessionTouchpoints: usesSession.length,
    unitTestFiles: unitTests.length,
    e2eSpecs: e2eTests.length,
    a11y,
    hasStore,
  });
}

console.log(JSON.stringify(report, null, 1));

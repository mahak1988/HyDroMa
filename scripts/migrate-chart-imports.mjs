// One-off migration: point scientific-workspace chart imports at @eco-nojin/ui.
//   node scripts/migrate-chart-imports.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const FILES = [
  "apps/scientific-workspace/src/components/Cards.tsx",
  "apps/scientific-workspace/src/pages/DashboardPage.tsx",
  "apps/scientific-workspace/src/pages/DomainPage.tsx",
  "apps/scientific-workspace/src/pages/RemoteSensingPage.tsx",
  "apps/scientific-workspace/src/pages/ScenariosPage.tsx",
  "apps/scientific-workspace/src/pages/SimulationPage.tsx",
];

const CHARTS_RE = /^import\s*\{([^}]*)\}\s*from\s*["'][^"']*components\/Charts["'];?\s*$/m;
const UI_RE = /^import\s*\{([^}]*)\}\s*from\s*["']@eco-nojin\/ui["'];?\s*$/m;

for (const relative of FILES) {
  const path = resolve(ROOT, relative);
  let source = readFileSync(path, "utf8");

  const charts = source.match(CHARTS_RE);
  if (!charts) {
    console.log(`skip (no Charts import): ${relative}`);
    continue;
  }
  const names = charts[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  source = source.replace(CHARTS_RE, "");

  const ui = source.match(UI_RE);
  if (ui) {
    const existing = ui[1].split(",").map((name) => name.trim()).filter(Boolean);
    const merged = [...new Set([...existing, ...names])].sort();
    source = source.replace(UI_RE, `import { ${merged.join(", ")} } from "@eco-nojin/ui";`);
  } else {
    const lines = source.split("\n");
    let lastImport = 0;
    lines.forEach((line, index) => {
      if (line.startsWith("import ")) lastImport = index;
    });
    lines.splice(lastImport + 1, 0, `import { ${names.sort().join(", ")} } from "@eco-nojin/ui";`);
    source = lines.join("\n");
  }

  writeFileSync(path, source, "utf8");
  console.log(`migrated ${relative}: ${names.join(", ")}`);
}
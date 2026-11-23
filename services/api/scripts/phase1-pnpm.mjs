// Phase 1: settle the package manager on pnpm everywhere.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const p = "package.json";
const json = JSON.parse(readFileSync(p, "utf8"));

// Root scripts: pnpm filter syntax everywhere; remove npm-workspace remnants.
json.scripts["dev:field"] = "pnpm --filter @eco-nojin/field-collection run dev";
json.scripts["build:field"] = "pnpm --filter @eco-nojin/field-collection run build";
json.description = "Eco Nojin unified platform monorepo — one port, public core, specialised sections, real API.";

// Lint paths: drop the archived apps, keep the rest.
json.scripts.lint = json.scripts.lint
  .split(" ")
  .filter((token) => !token.startsWith("apps/portal") && !token.startsWith("apps/home"))
  .join(" ");

writeFileSync(p, JSON.stringify(json, null, 2) + "\n");

// One lockfile: pnpm is authoritative.
try {
  unlinkSync("package-lock.json");
  console.log("package-lock.json removed");
} catch {
  console.log("package-lock.json already absent");
}

// build-all's final hint should speak pnpm too.
{
  const b = "scripts/build-all.mjs";
  let s = readFileSync(b, "utf8");
  s = s.replace("Start the host with: npm run preview", "Start the host with: pnpm run preview");
  writeFileSync(b, s);
}

console.log("package manager settled: pnpm");

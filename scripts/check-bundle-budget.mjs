import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Bundle budget gate for the unified platform.
 *
 * Budgets (see docs/architecture/BUNDLE-BUDGET.md):
 *  - initial entry chunk (index-*.js) ≤ 900 KB
 *  - every lazy section entry (router-*.js) ≤ 700 KB
 *
 * Section entries are the `router-*.js` chunks produced by each lazy section
 * (tourism, market, landscape, science, admin). Vendor chunks (MapLibre, deck.gl,
 * ScienceMap, the shared expression engine) are loaded only by the page that
 * needs them and are not section entries; they are reported but not capped.
 */
const ROOT = process.cwd();
const DIST = join(ROOT, "apps", "platform", "dist");
const ASSETS = join(DIST, "assets");

const INITIAL_BUDGET = 900 * 1024;
const SECTION_BUDGET = 700 * 1024;

if (!existsSync(join(DIST, "index.html"))) {
  console.error("bundle budget: apps/platform/dist is missing — run pnpm run build:all first");
  process.exit(1);
}

const html = readFileSync(join(DIST, "index.html"), "utf8");
const entryMatch = html.match(/\/assets\/([^"]+\.js)/u);
if (!entryMatch) {
  console.error("bundle budget: could not find the entry script in apps/platform/dist/index.html");
  process.exit(1);
}

const files = readdirSync(ASSETS).filter((file) => file.endsWith(".js"));
const sizeOf = (file) => statSync(join(ASSETS, file)).size;
const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

const entry = entryMatch[1] ?? "";
const entrySize = sizeOf(entry);
const sectionChunks = files
  .filter((file) => /^router-/u.test(file))
  .map((file) => ({ file, size: sizeOf(file) }))
  .sort((a, b) => b.size - a.size);
const vendors = files
  .filter((file) => !/^(router|index)-/u.test(file))
  .map((file) => ({ file, size: sizeOf(file) }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 5);

const problems = [];
if (entrySize > INITIAL_BUDGET) problems.push(`initial entry ${entry} is ${kb(entrySize)} (budget ${kb(INITIAL_BUDGET)})`);
for (const chunk of sectionChunks) {
  if (chunk.size > SECTION_BUDGET) problems.push(`section chunk ${chunk.file} is ${kb(chunk.size)} (budget ${kb(SECTION_BUDGET)})`);
}

console.log(`bundle budget: initial ${entry} = ${kb(entrySize)} (budget ${kb(INITIAL_BUDGET)})`);
for (const chunk of sectionChunks) console.log(`  section ${chunk.file} = ${kb(chunk.size)}`);
for (const vendor of vendors) console.log(`  vendor  ${vendor.file} = ${kb(vendor.size)} (not capped)`);

if (problems.length > 0) {
  console.error("\nbundle budget FAILED:");
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}

console.log("Bundle budget OK");
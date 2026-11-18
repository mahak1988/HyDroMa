// Eco Nojin web build — zero dependencies.
// Assembles a static, deployable site into ./dist by:
//   1. copying the authored app (src/**) into dist
//   2. copying the Eco Nojin Design System v2 CSS into dist/styles
//   3. copying the Design System local fonts into dist/assets/fonts
//   4. copying the brand logos into dist/assets/logos
// It does NOT bundle, transpile, minify or fetch anything from the network.
// Removing dist and re-running fully reproduces the output (deterministic, offline).

import { rm, mkdir, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, 'dist');
const SRC = path.join(HERE, 'src');
const DS = path.resolve(HERE, '..', 'brand', 'eco-nojin-design-system-v2');
const BRAND = path.resolve(HERE, '..', 'brand', 'assets');

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await cp(s, d);
  }
}

async function copyFiles(srcDir, destDir, filter) {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (filter && !filter(entry.name)) continue;
    await cp(path.join(srcDir, entry.name), path.join(destDir, entry.name));
  }
}

async function main() {
  if (!existsSync(DS)) throw new Error(`Design System not found at ${DS}`);
  if (!existsSync(BRAND)) throw new Error(`Brand assets not found at ${BRAND}`);

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  // 1. authored app
  await copyDir(SRC, DIST);

  // 2. design-system css -> dist/styles
  await copyFiles(path.join(DS, 'css'), path.join(DIST, 'styles'), (n) => n.endsWith('.css'));

  // 3. design-system fonts -> dist/assets/fonts
  await copyDir(path.join(DS, 'assets', 'fonts'), path.join(DIST, 'assets', 'fonts'));

  // 4. brand logos -> dist/assets/logos
  await copyFiles(BRAND, path.join(DIST, 'assets', 'logos'), (n) => n.endsWith('.svg'));

  const css = (await readdir(path.join(DIST, 'styles'))).filter((f) => f.endsWith('.css'));
  const fonts = (await readdir(path.join(DIST, 'assets', 'fonts'))).length;
  const logos = (await readdir(path.join(DIST, 'assets', 'logos'))).filter((f) => f.endsWith('.svg'));

  const indexStat = await stat(path.join(DIST, 'index.html'));
  console.log('Eco Nojin build complete.');
  console.log(`  output      : ${path.relative(process.cwd(), DIST) || 'dist'}`);
  console.log(`  styles      : ${css.join(', ')}`);
  console.log(`  fonts       : ${fonts} files`);
  console.log(`  logos       : ${logos.join(', ')}`);
  console.log(`  index.html  : ${indexStat.size} bytes`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
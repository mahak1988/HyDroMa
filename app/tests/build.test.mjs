import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const DIST = path.join(APP, 'dist');

before(() => {
  execFileSync(process.execPath, ['build.mjs'], { cwd: APP, stdio: 'pipe' });
});

function localRefs(html) {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^(https?:|data:|#|mailto:)/i.test(r));
}

test('build produces dist/index.html', () => {
  assert.ok(existsSync(path.join(DIST, 'index.html')), 'dist/index.html missing');
});

test('every local asset referenced by index.html exists in dist', () => {
  const html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const refs = localRefs(html);
  assert.ok(refs.length > 0, 'expected local asset references');
  for (const ref of refs) {
    const clean = ref.split('?')[0].replace(/^\.\//, '');
    const target = path.join(DIST, clean);
    assert.ok(existsSync(target), `referenced asset not built: ${ref}`);
  }
});

test('design-system stylesheets are copied into dist/styles', () => {
  const styles = readdirSync(path.join(DIST, 'styles')).filter((f) => f.endsWith('.css'));
  for (const required of ['tokens.css', 'themes.css', 'typography.css', 'reset.css', 'components.css', 'layout.css', 'home.css', 'application-shell.css', 'responsive.css']) {
    assert.ok(styles.includes(required), `dist/styles missing ${required}`);
  }
});

test('application shell files are copied into dist', () => {
  for (const f of ['app.html', 'styles/application-shell.css', 'js/app.js', 'js/navigation.js', 'js/interactions.js', 'js/app-i18n.js']) {
    assert.ok(existsSync(path.join(DIST, f)), `dist missing ${f}`);
  }
});

test('research scaffold: every expected source file exists in dist', () => {
  const required = [
    'index.html',
    'assets/fonts/fonts.css',
    'assets/logos/eco-nojin-logo.svg',
    'styles/tokens.css', 'styles/themes.css', 'styles/typography.css', 'styles/reset.css',
    'styles/components.css', 'styles/layout.css', 'styles/home.css',
    'styles/application-shell.css', 'styles/responsive.css',
    'js/main.js', 'js/i18n.js', 'js/theme.js', 'js/navigation.js', 'js/interactions.js',
  ];
  for (const f of required) assert.ok(existsSync(path.join(DIST, f)), `missing ${f}`);
  const images = readdirSync(path.join(DIST, 'assets', 'images')).filter((f) => f.endsWith('.svg'));
  assert.ok(images.length > 0, 'dist/assets/images is empty');
});

test('all fonts referenced by fonts.css exist in dist/assets/fonts', () => {
  const fontsCss = readFileSync(path.join(DIST, 'assets', 'fonts', 'fonts.css'), 'utf8');
  const urls = [...fontsCss.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, ''));
  assert.ok(urls.length > 0, 'expected font urls');
  for (const u of urls) {
    const target = path.join(DIST, 'assets', 'fonts', u.replace(/^\.\//, ''));
    assert.ok(existsSync(target), `font file not built: ${u}`);
  }
});

test('the three brand logos are copied into dist/assets/logos', () => {
  const logos = readdirSync(path.join(DIST, 'assets', 'logos')).filter((f) => f.endsWith('.svg'));
  for (const required of ['eco-nojin-logo.svg', 'hydroma-logo.svg', 'nojin-marketplace-logo.svg']) {
    assert.ok(logos.includes(required), `dist/assets/logos missing ${required}`);
  }
});

test('every local asset referenced by app.html exists in dist', () => {
  const appHtml = readFileSync(path.join(DIST, 'app.html'), 'utf8');
  const refs = [...appHtml.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^(https?:|data:|#|mailto:)/i.test(r));
  assert.ok(refs.length > 0);
  for (const r of refs) {
    assert.ok(existsSync(path.join(DIST, r.replace(/^\.\//, ''))), `app.html asset not built: ${r}`);
  }
});

test('build is reproducible: a second build yields the same index.html', () => {
  const first = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  execFileSync(process.execPath, ['build.mjs'], { cwd: APP, stdio: 'pipe' });
  const second = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  assert.equal(first, second);
});
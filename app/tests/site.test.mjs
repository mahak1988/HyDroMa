import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { messages, flatten } from '../src/js/i18n.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const html = readFileSync(path.join(APP, 'src', 'index.html'), 'utf8');
const homeCss = readFileSync(path.join(APP, 'src', 'styles', 'home.css'), 'utf8');

const dicts = { fa: flatten(messages.fa), en: flatten(messages.en) };

function attrKeys(attr) {
  const out = [];
  const re = new RegExp(`${attr}="([^"]+)"`, 'g');
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

test('document declares Persian RTL and a theme by default', () => {
  assert.match(html, /<html[^>]*lang="fa"[^>]*dir="rtl"[^>]*data-theme="A"/);
});

test('document declares a responsive viewport and a meta description', () => {
  assert.match(html, /name="viewport"\s+content="width=device-width/);
  assert.match(html, /name="description"/);
});

test('page has a skip link, a main landmark and the expected section anchors', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main">/);
  for (const id of ['top', 'ecosystem', 'hydroma', 'marketplace', 'services', 'about', 'site-footer']) {
    assert.ok(html.includes(`id="${id}"`), `missing section id ${id}`);
  }
});

test('every data-i18n key used in the HTML exists in both languages', () => {
  const keys = [...attrKeys('data-i18n'), ...attrKeys('data-i18n-aria')];
  assert.ok(keys.length > 40, `expected many i18n keys, found ${keys.length}`);
  for (const key of keys) {
    assert.ok(Object.prototype.hasOwnProperty.call(dicts.fa, key), `fa missing key ${key}`);
    assert.ok(Object.prototype.hasOwnProperty.call(dicts.en, key), `en missing key ${key}`);
  }
});

test('there are no i18n keys defined but unused (catches typos and dead copy)', () => {
  const used = new Set([...attrKeys('data-i18n'), ...attrKeys('data-i18n-aria')]);
  // These keys are applied programmatically (not via data-i18n in markup).
  const programmatic = new Set(['meta.title', 'meta.description', 'a11y.menuClose']);
  for (const key of Object.keys(dicts.fa)) {
    if (programmatic.has(key)) continue;
    assert.ok(used.has(key), `dictionary key "${key}" is never used in the HTML`);
  }
});

test('every image has a non-empty alt attribute', () => {
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  assert.ok(imgs.length > 0, 'expected at least one image');
  for (const tag of imgs) {
    const alt = /alt="([^"]*)"/.exec(tag);
    assert.ok(alt, `image without alt: ${tag.slice(0, 60)}`);
  }
});

test('interactive controls have accessible names', () => {
  // every <button> has aria-label or visible text
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0]);
  assert.ok(buttons.length > 0);
  for (const b of buttons) {
    const hasAria = /aria-label="[^"]+"/.test(b) || /data-i18n-aria=/.test(b);
    const hasText = />[^<]*[A-Za-z\u0600-\u06FF][^<]*</.test(b);
    assert.ok(hasAria || hasText, `button without accessible name: ${b.slice(0, 80)}`);
  }
});

test('no external network resources are referenced (fully offline)', () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    assert.ok(!/^https?:\/\//i.test(ref), `external resource referenced: ${ref}`);
  }
  // also guard the stylesheets/scripts we ship
  for (const [name, text] of [['home.css', homeCss]]) {
    assert.ok(!/url\(\s*['"]?https?:/i.test(text), `${name} references a remote url()`);
  }
});

test('stylesheet references the design-system styles it depends on', () => {
  assert.match(html, /styles\/tokens\.css/);
  assert.match(html, /styles\/themes\.css/);
  assert.match(html, /styles\/home\.css/);
  assert.match(html, /js\/main\.js/);
});

test('page styles do not hard-code brand colour hex values (token-driven)', () => {
  const brandHex = ['#0b5563', '#0a3f49', '#0e7c8c', '#c9a227', '#35c4d7', '#2e3a87', '#e76f51', '#0f1e24', '#5a6b72', '#d5dde0'];
  const lower = homeCss.toLowerCase();
  for (const hex of brandHex) {
    assert.ok(!lower.includes(hex), `home.css hard-codes brand colour ${hex}; use a token`);
  }
});

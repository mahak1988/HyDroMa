import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NAV, resolveRoute, normalizeRoute, DEFAULT_ROUTE, stats } from '../src/js/navigation.js';
import { messages, translate, formatNumber, isRtl } from '../src/js/app-i18n.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const html = readFileSync(path.join(APP, 'src', 'app.html'), 'utf8');
const appCss = readFileSync(path.join(APP, 'src', 'styles', 'application-shell.css'), 'utf8');

// ---------------- nav model ----------------
test('nav has dashboard (ready) + HyDroMA group (8) + Marketplace group + settings', () => {
  const dashboard = NAV.find((n) => n.id === 'dashboard');
  assert.equal(dashboard.status, 'ready');
  const hydro = NAV.find((n) => n.id === 'hydroma');
  const market = NAV.find((n) => n.id === 'marketplace');
  assert.ok(hydro && hydro.type === 'group' && hydro.children.length === 8);
  assert.ok(market && market.type === 'group' && market.children.length === 2);
  // HyDroMA overview + water are implemented
  assert.equal(hydro.children.find((c) => c.id === 'overview').status, 'ready');
  assert.equal(hydro.children.find((c) => c.id === 'water').status, 'ready');
});

test('route resolution works and unknown routes fall back to dashboard', () => {
  assert.equal(normalizeRoute(''), DEFAULT_ROUTE);
  assert.equal(resolveRoute('#/hydroma').item.id, 'overview');
  assert.equal(resolveRoute('#/hydroma/water').item.id, 'water');
  assert.equal(resolveRoute('#/hydroma/water').group.id, 'hydroma');
  assert.equal(resolveRoute('#/marketplace/tourism').item.id, 'tourism');
  assert.equal(resolveRoute('#/does-not-exist').route, DEFAULT_ROUTE);
});

test('stats reports 3 implemented modules and 9 planned', () => {
  const s = stats();
  assert.equal(s.active, 3); // dashboard + hydroma overview + water balance
  assert.equal(s.planned, 9); // 6 hydroma + market + tourism + settings
});

// ---------------- i18n ----------------
test('fa and en app dictionaries expose identical keys', () => {
  assert.deepEqual(Object.keys(messages.fa).sort(), Object.keys(messages.en).sort());
});

test('every nav label key exists in both dictionaries', () => {
  for (const n of NAV) {
    const nodes = n.type === 'group' ? [n, ...n.children] : [n];
    for (const node of nodes) {
      assert.ok(messages.fa[node.labelKey], `fa missing ${node.labelKey}`);
      assert.ok(messages.en[node.labelKey], `en missing ${node.labelKey}`);
    }
  }
});

test('translate interpolates variables and formatNumber localises digits', () => {
  assert.equal(translate('fa', 'placeholder.desc', { name: 'آب' }).includes('آب'), true);
  assert.equal(formatNumber(24, 'fa'), '۲۴');
  assert.equal(formatNumber(24, 'en'), '24');
  assert.equal(isRtl('fa'), true);
});

// ---------------- shell html ----------------
test('app.html has the shell regions and topbar controls', () => {
  for (const id of ['sidebar', 'side-nav', 'menu-btn', 'crumbs', 'page-title', 'view', 'notif-btn', 'notif-panel', 'profile-btn', 'profile-panel', 'scrim']) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }
  assert.match(html, /styles\/application-shell\.css/);
  assert.match(html, /js\/app\.js/);
});

test('app.html loads the reset and uses the extracted navigation/interactions modules', () => {
  assert.match(html, /styles\/reset\.css/);
  assert.match(html, /js\/app\.js/);
});

test('every data-app-i18n key used in app.html exists in both dictionaries', () => {
  const keys = [...html.matchAll(/data-app-i18n(?:-aria)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 5);
  for (const k of keys) {
    assert.ok(messages.fa[k], `fa missing ${k}`);
    assert.ok(messages.en[k], `en missing ${k}`);
  }
});

test('app.html has no external resources', () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const r of refs) assert.ok(!/^https?:\/\//i.test(r), `external ref ${r}`);
});

test('app.css does not hard-code brand hex values', () => {
  const lower = appCss.toLowerCase();
  for (const hex of ['#0b5563', '#0a3f49', '#0e7c8c', '#c9a227', '#35c4d7', '#2e3a87', '#e76f51', '#0f1e24', '#5a6b72', '#d5dde0']) {
    assert.ok(!lower.includes(hex), `app.css hard-codes ${hex}`);
  }
});
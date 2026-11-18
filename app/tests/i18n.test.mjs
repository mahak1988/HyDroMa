import test from 'node:test';
import assert from 'node:assert/strict';
import { messages, flatten, LANGS, DEFAULT_LANG, translate, resolve, isRtl } from '../src/js/i18n.js';

const faKeys = Object.keys(flatten(messages.fa)).sort();
const enKeys = Object.keys(flatten(messages.en)).sort();

test('language list is exactly fa and en with fa as default', () => {
  assert.deepEqual(LANGS, ['fa', 'en']);
  assert.equal(DEFAULT_LANG, 'fa');
});

test('Persian and English dictionaries expose the exact same keys', () => {
  assert.deepEqual(faKeys, enKeys, `key mismatch: only-fa=${faKeys.filter((k) => !enKeys.includes(k))} only-en=${enKeys.filter((k) => !faKeys.includes(k))}`);
});

test('no translation value is empty in either language', () => {
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(flatten(messages[lang]))) {
      assert.equal(typeof value, 'string', `${lang}:${key} is not a string`);
      assert.ok(value.trim().length > 0, `${lang}:${key} is empty`);
    }
  }
});

test('translate returns the right language string', () => {
  assert.equal(translate('fa', 'nav.home'), 'خانه');
  assert.equal(translate('en', 'nav.home'), 'Home');
});

test('translate throws on an unknown key instead of returning undefined', () => {
  assert.throws(() => translate('fa', 'does.not.exist'), /Missing i18n key/);
});

test('resolve walks nested objects and reports missing keys', () => {
  assert.equal(resolve({ a: { b: 'c' } }, 'a.b'), 'c');
  assert.equal(resolve({ a: 1 }, 'a'), 1);
  assert.equal(resolve({ a: 1 }, 'x'), undefined);
});

test('isRtl is true for Persian and false for English', () => {
  assert.equal(isRtl('fa'), true);
  assert.equal(isRtl('en'), false);
});

test('flatten produces identical key sets for both dictionaries', () => {
  assert.deepEqual(Object.keys(flatten(messages.fa)).sort(), Object.keys(flatten(messages.en)).sort());
});

test('expected high-level sections are present in both languages', () => {
  const required = [
    'hero.title',
    'eco.title',
    'hydro.title',
    'market.title',
    'services.title',
    'process.title',
    'invite.title',
    'footer.tagline',
  ];
  for (const key of required) {
    assert.ok(faKeys.includes(key), `fa missing ${key}`);
    assert.ok(enKeys.includes(key), `en missing ${key}`);
  }
});

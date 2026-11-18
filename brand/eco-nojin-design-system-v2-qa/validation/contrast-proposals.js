const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..', 'assets', 'fonts');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.woff2'));
function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(r, g, b) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function ratio(a, b) { const L1 = lum(...a), L2 = lum(...b); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return +(((hi + 0.05) / (lo + 0.05))).toFixed(2); }
function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }

// Reference palette (never changed) + QA-proposed darker text variants
const palette = {
  A: { primary: '#0B5563', secondary: '#C9A227', accent: '#35C4D7', success: '#2E9E5B', warning: '#D98A1F', danger: '#D64545', info: '#2E6FD6', uncal: '#8A97A0', market: '#E76F51', ink: '#0F1E24', slate: '#5A6B72', pageBg: '#F5F7F8', surface: '#FFFFFF' },
  B: { primary: '#173B63', secondary: '#D9682B', accent: '#C9A34A', success: '#2E9E5B', warning: '#D98A1F', danger: '#D64545', info: '#2E6FD6', uncal: '#8A97A0', market: '#D9682B', ink: '#1F2933', slate: '#5A6B72', pageBg: '#FBF7F0', surface: '#FFFDFC' },
};
// Proposed text-safe variants for white-on-X fills (only for text-bearing components; swatch fills unchanged)
const qaText = {
  success: '#1E7A45',   // on white → for text; also white-on- this ≥4.5
  warning: '#8A5A00',
  danger: '#C62828',
  info: '#1D5BBF',
  uncal: '#5A6B72',
  accentA: '#0E7C8C',
  accentB: '#B34A1E',
  secondaryA: '#7A5E00',
};
const pairs = [
  ['A secondary #C9A227 vs white', '#C9A227', '#FFFFFF'],
  ['A market #E76F51 vs white', '#E76F51', '#FFFFFF'],
  ['A success #2E9E5B vs white', '#2E9E5B', '#FFFFFF'],
  ['A warning #D98A1F vs white', '#D98A1F', '#FFFFFF'],
  ['A danger #D64545 vs white', '#D64545', '#FFFFFF'],
  ['A uncal #8A97A0 vs white', '#8A97A0', '#FFFFFF'],
  ['B secondary #D9682B vs white', '#D9682B', '#FFFFFF'],
  ['B accent #C9A34A vs white', '#C9A34A', '#FFFFFF'],
  ['white on A btn-accent #C9A227', '#FFFFFF', '#C9A227'],
  ['white on B btn-accent #D9682B', '#FFFFFF', '#D9682B'],
  ['white on success #2E9E5B', '#FFFFFF', '#2E9E5B'],
  ['white on warning #D98A1F', '#FFFFFF', '#D98A1F'],
  ['white on danger #D64545', '#FFFFFF', '#D64545'],
  ['white on uncal #8A97A0', '#FFFFFF', '#8A97A0'],
  ['A info #2E6FD6 text on light', '#2E6FD6', '#EEF3FC'],
  ['A slate #5A6B72 on cloud', '#5A6B72', '#F5F7F8'],
  ['A gold #C9A227 text on white (type sample)', '#C9A227', '#FFFFFF'],
];
console.log('=== CURRENT white-on-color contrast ===');
for (const [n, f, b] of pairs) console.log(ratio(hex(f), hex(b)), n);
console.log('\n=== QA-proposed text variants (white on them, and them on white) ===');
for (const [k, v] of Object.entries(qaText)) {
  console.log(k, v, 'whiteOnIt=' + ratio([255, 255, 255], hex(v)), 'itOnWhite=' + ratio(hex(v), [255, 255, 255]), 'itOnPageA=' + ratio(hex(v), hex(palette.A.pageBg)), 'itOnPageB=' + ratio(hex(v), hex(palette.B.pageBg)));
}
// black/dark text on gold (alternative fix for gold swatch/badge text)
console.log('\n=== Alternative: dark ink on gold/amber (no palette change) ===');
for (const bg of ['#C9A227', '#D98A1F', '#E76F51', '#C9A34A', '#D9682B']) {
  console.log('ink #0F1E24 on ' + bg + ' = ' + ratio(hex('#0F1E24'), hex(bg)));
}
// print unique file hash list
const crypto = require('crypto');
console.log('\n=== unique font files ===');
const uniq = new Set();
for (const f of files) { const h = crypto.createHash('md5').update(fs.readFileSync(path.join(dir, f))).digest('hex'); uniq.add(h); }
console.log('woff2 files:', files.length, 'unique content hashes:', uniq.size);
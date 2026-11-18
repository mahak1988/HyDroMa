// WCAG contrast computation from measured RGB values in audit-raw.json
const fs = require('fs');
const path = require('path');
const raw = require('./audit-raw.json');

function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(r, g, b) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function contrast(a, b) { const L1 = lum(...a), L2 = lum(...b); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return +(((hi + 0.05) / (lo + 0.05))).toFixed(2); }

const rows = [];
for (const w of ['375', '1440']) {
  for (const th of ['A', 'B']) {
    const samples = raw.themes[w][th].contrast;
    for (const s of samples) {
      const need = s.large ? 3.0 : 4.5;
      const ratio = contrast(s.fg, s.bg);
      rows.push({
        vw: +w, theme: th, need, ratio,
        pass: ratio >= need,
        text: s.text, sel: s.sel, fontSize: s.fontSize, fontWeight: s.fontWeight,
        fg: s.fg.join(','), bg: s.bg.join(','),
      });
    }
  }
}
// dedupe by vw+theme+sel+text
const seen = new Set();
const uniq = rows.filter(r => { const k = r.vw + '|' + r.theme + '|' + r.sel + '|' + r.text; if (seen.has(k)) return false; seen.add(k); return true; });

const fails = uniq.filter(r => !r.pass);
console.log('Total unique contrast samples:', uniq.length);
console.log('FAILS:', fails.length);
for (const f of fails) {
  console.log(`[${f.vw}][T${f.theme}] need ${f.need} got ${f.ratio} :: ${f.sel} :: "${f.text}" :: fg(${f.fg}) bg(${f.bg}) ${f.fontSize}px/${f.fontWeight}`);
}
console.log('\n--- Theme A (1440) all ---');
for (const r of uniq.filter(r => r.vw === 1440 && r.theme === 'A')) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.ratio} (need ${r.need}) ${r.fontSize}px/${r.fontWeight} ${r.sel} "${r.text}" fg(${r.fg}) bg(${r.bg})`);
console.log('\n--- Theme B (1440) all ---');
for (const r of uniq.filter(r => r.vw === 1440 && r.theme === 'B')) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.ratio} (need ${r.need}) ${r.fontSize}px/${r.fontWeight} ${r.sel} "${r.text}" fg(${r.fg}) bg(${r.bg})`);
fs.writeFileSync(path.join(__dirname, 'contrast-results.json'), JSON.stringify({ uniq, fails }, null, 2));
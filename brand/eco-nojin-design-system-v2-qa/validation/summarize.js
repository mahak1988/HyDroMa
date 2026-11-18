const r = require('./deep-audit.json');
console.log('=== SECTION CONTRAST FAILS ===');
let totalFails = 0;
for (const id of Object.keys(r.sections)) {
  for (const th of ['A', 'B']) {
    const s = r.sections[id][th];
    console.log(id, th, 'samples=' + s.total, 'fails=' + s.fails.length);
    for (const f of s.fails) {
      totalFails++;
      console.log('   ', f.ratio, 'need' + f.need, f.fontSize + 'px/' + f.fontWeight, f.sel, JSON.stringify(f.text), 'fg(' + f.fg + ') bg(' + f.bg + ')');
    }
  }
}
console.log('TOTAL FAILS (both themes, all sections):', totalFails);
console.log('\n=== KEYBOARD focusOrder (first 18) ===');
r.keyboard.focusOrder.slice(0, 18).forEach((f, i) => console.log(i, f && f.tag, JSON.stringify(f && f.text), 'outline=' + (f && f.outline), 'shadow=' + (f && f.boxShadow).slice(0, 30), 'inVP=' + (f && f.inViewport)));
console.log('shiftTab:', JSON.stringify(r.keyboard.shiftTab));
console.log('skipLink:', JSON.stringify(r.keyboard.skipLink));
console.log('landmarks:', JSON.stringify(r.keyboard.landmarks));
console.log('headings:', JSON.stringify(r.keyboard.headings));
console.log('aria:', JSON.stringify(r.keyboard.aria));
console.log('unlabeledInputs:', JSON.stringify(r.keyboard.unlabeledInputs));
console.log('svgA11y:', JSON.stringify(r.keyboard.svgA11y));
console.log('\n=== RTL ===');
console.log(JSON.stringify(r.rtl, null, 1));
console.log('\n=== THEME ===');
console.log('A:', JSON.stringify(r.theme.A));
console.log('B:', JSON.stringify(r.theme.B));
console.log('persisted:', r.theme.persisted, 'afterReload:', r.theme.afterReload);
console.log('components:', JSON.stringify(r.theme.components, null, 1));
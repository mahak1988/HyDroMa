const r = require('./deep-audit.json');
const fails = [];
for (const id of Object.keys(r.sections))
  for (const th of ['A', 'B'])
    for (const f of r.sections[id][th].fails)
      fails.push(id + '/' + th + ' ' + f.ratio + ' need' + f.need + ' ' + f.sel + ' ' + JSON.stringify(f.text));
console.log('CONTRAST FAILS:', fails.length);
fails.forEach(f => console.log('  ' + f));
let ov = 0;
for (const w of Object.keys(r.overflowBySize))
  for (const loc of Object.keys(r.overflowBySize[w]))
    for (const id of Object.keys(r.overflowBySize[w][loc]))
      if (r.overflowBySize[w][loc][id].overflowX) ov++;
console.log('DOC OVERFLOW:', ov);
console.log('theme persisted:', r.theme.persisted, '| afterReload:', r.theme.afterReload);
console.log('skipLink:', r.keyboard.skipLink, '| landmarks:', JSON.stringify(r.keyboard.landmarks));
console.log('unlabeledInputs:', JSON.stringify(r.keyboard.unlabeledInputs));
console.log('aria tablist/tab:', r.keyboard.aria.tablist, '/', r.keyboard.aria.tab);
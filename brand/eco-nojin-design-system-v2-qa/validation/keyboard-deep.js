const { chromium } = require('playwright');
const path = require('path');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(fileUrl, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);

  // Tab through 40 steps, record activeElement + whether it has a visible focus indicator
  const seq = [];
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press('Tab');
    const info = await p.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30), outline: cs.outlineStyle + ' ' + cs.outlineWidth, hasVisibleOutline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, isBody: el === document.body };
    });
    seq.push(info);
  }
  const bodyCount = seq.filter(s => s.isBody).length;
  const focusableCount = seq.filter(s => !s.isBody).length;
  const noOutline = seq.filter(s => !s.isBody && !s.hasVisibleOutline).length;
  console.log('Tab steps: 40 | focusable stops:', focusableCount, '| body stops:', bodyCount, '| focusable without visible outline:', noOutline);

  // Now test each section's interactive elements are reachable
  const ids = await p.evaluate(() => [...document.querySelectorAll('.tab-panel')].map(x => x.id));
  const perSection = {};
  for (const id of ids) {
    await p.evaluate(sid => document.querySelectorAll('.tab-panel').forEach(x => x.classList.toggle('active', x.id === sid)), id);
    await p.waitForTimeout(80);
    // focus first interactive in section and tab within
    const r = await p.evaluate(() => {
      const panel = document.querySelector('.tab-panel.active');
      const els = [...panel.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
      return { interactive: els.length, types: [...new Set(els.map(e => e.tagName.toLowerCase()))] };
    });
    perSection[id] = r;
  }
  console.log('Per-section interactive elements:', JSON.stringify(perSection, null, 1));

  // 320px overflow check (bonus, narrower than required)
  const p2 = await b.newPage({ viewport: { width: 320, height: 800 } });
  await p2.goto(fileUrl, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(200);
  for (const loc of ['fa', 'en']) {
    await p2.click(`.locale-btn[data-locale="${loc}"]`);
    await p2.waitForTimeout(120);
    for (const id of ids) {
      await p2.evaluate(sid => document.querySelectorAll('.tab-panel').forEach(x => x.classList.toggle('active', x.id === sid)), id);
      const o = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, over: document.documentElement.scrollWidth > innerWidth + 1 }));
      if (o.over) console.log(`320px ${loc} ${id}: OVERFLOW scrollW=${o.sw}`);
    }
  }
  console.log('320px check done.');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
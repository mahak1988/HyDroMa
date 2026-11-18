const { chromium } = require('playwright');
const path = require('path');
const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'a11y')));
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const out = [];
    // elements whose right edge exceeds viewport (rtl → overflow to the left is left<0)
    document.querySelectorAll('body *').forEach(el => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || b.width === 0) return;
      // find elements extending past the padding box
      if (b.left < -0.5) out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 60), left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), txt: (el.textContent || '').trim().slice(0, 40) });
    });
    // Also check scrollWidth contributors: deepest element with scrollWidth > clientWidth
    const scrollers = [];
    document.querySelectorAll('body *').forEach(el => { if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) scrollers.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50), sw: el.scrollWidth, cw: el.clientWidth, overflowX: getComputedStyle(el).overflowX, txt: (el.textContent || '').trim().slice(0, 30) }); });
    return { leftOverflow: out.slice(0, 25), scrollers: scrollers.slice(0, 25) };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const probe = async (label) => {
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const out = { scrollW: de.scrollWidth, clientW: de.clientWidth, offenders: [] };
      const vw = de.clientWidth;
      document.querySelectorAll('body *').forEach(el => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (b.width === 0) return;
        if (b.right > vw + 1 || b.left < -1) {
          out.offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 60), left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), sw: el.scrollWidth, cw: el.clientWidth, txt: (el.textContent || '').trim().slice(0, 30) });
        }
      });
      return out;
    });
    console.log('=== ' + label + ' === scrollW=' + r.scrollW + ' clientW=' + r.clientW);
    r.offenders.slice(0, 20).forEach(o => console.log(JSON.stringify(o)));
  };
  await page.evaluate(() => document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'components')));
  await probe('components@375');
  await page.evaluate(() => document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'a11y')));
  await probe('a11y@375');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
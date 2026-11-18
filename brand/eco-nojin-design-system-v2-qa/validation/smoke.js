const { chromium } = require('playwright');
const path = require('path');
const url = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror:' + e.message));
  p.on('requestfailed', r => errs.push('reqfail:' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    sections: document.querySelectorAll('.tab-panel').length,
    logos: [...document.querySelectorAll('img')].filter(i => i.src.endsWith('.svg')).length,
    navLinks: document.querySelectorAll('.app-header .nav a').length,
    themeBtns: document.querySelectorAll('.theme-btn').length,
    localeBtns: document.querySelectorAll('.locale-btn').length,
  }));
  await p.click('.theme-btn[data-theme="B"]');
  await p.waitForTimeout(200);
  const themeB = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await p.click('.app-header .nav a[href="#components"]');
  await p.waitForTimeout(200);
  const active = await p.evaluate(() => document.querySelector('.tab-panel.active').id);
  await p.click('.locale-btn[data-locale="en"]');
  await p.waitForTimeout(200);
  const dir = await p.evaluate(() => document.documentElement.getAttribute('dir'));
  console.log('SMOKE:', JSON.stringify(r));
  console.log('themeB after click:', themeB, '| active after nav:', active, '| dir after en:', dir);
  console.log('ERRORS:', errs.length, errs.slice(0, 5).join(' | '));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
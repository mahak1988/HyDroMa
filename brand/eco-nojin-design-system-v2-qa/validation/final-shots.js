// Regenerate final screenshots (post-fix) for theme-a, theme-b, rtl, ltr, responsive
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'screenshots');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  fs.readFile(fp, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); res.end(d); });
});

async function setSection(page, id) {
  await page.evaluate(sid => document.querySelectorAll('.tab-panel').forEach(x => x.classList.toggle('active', x.id === sid)), id);
  await page.waitForTimeout(150);
}

server.listen(0, async () => {
  const port = server.address().port; const base = `http://127.0.0.1:${port}/`;
  const b = await chromium.launch({ channel: 'chrome' });
  const shot = async (w, h, name, setup) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (setup) await setup(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, name) });
    await ctx.close();
  };
  // responsive overview per width
  for (const w of [375, 480, 768, 1024, 1440, 1920]) await shot(w, 900, path.join('responsive', `overview-${w}.png`));
  // theme A/B
  await shot(1440, 900, path.join('theme-a', 'overview-1440.png'), p => p.evaluate(() => document.documentElement.setAttribute('data-theme', 'A')));
  await shot(1440, 900, path.join('theme-b', 'overview-1440.png'), p => p.evaluate(() => document.documentElement.setAttribute('data-theme', 'B')));
  await shot(1440, 900, path.join('theme-a', 'components-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'A')); await setSection(p, 'components'); });
  await shot(1440, 900, path.join('theme-b', 'components-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'B')); await setSection(p, 'components'); });
  await shot(1440, 900, path.join('theme-a', 'science-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'A')); await setSection(p, 'science'); });
  await shot(1440, 900, path.join('theme-b', 'science-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'B')); await setSection(p, 'science'); });
  // rtl/ltr
  await shot(1440, 900, path.join('rtl', 'fa-1440.png'), p => p.click('.locale-btn[data-locale="fa"]'));
  await shot(1440, 900, path.join('ltr', 'en-1440.png'), p => p.click('.locale-btn[data-locale="en"]'));
  await shot(1440, 900, path.join('rtl', 'ar-1440.png'), p => p.click('.locale-btn[data-locale="ar"]'));
  await shot(1440, 900, path.join('rtl', 'ar-components-1440.png'), async p => { await p.click('.locale-btn[data-locale="ar"]'); await setSection(p, 'components'); });
  // small-screen component shots
  await shot(375, 812, path.join('responsive', 'components-375.png'), p => setSection(p, 'components'));
  await shot(375, 812, path.join('responsive', 'science-375.png'), p => setSection(p, 'science'));
  await shot(375, 812, path.join('responsive', 'market-375.png'), p => setSection(p, 'market'));
  await b.close(); server.close();
  console.log('SHOTS_DONE');
});
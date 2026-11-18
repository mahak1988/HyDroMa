const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  fs.readFile(fp, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); res.end(d); });
});
server.listen(0, async () => {
  const port = server.address().port; const base = `http://127.0.0.1:${port}/`;
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);

  // 1) Check .nav (non-header) + .theme-btn computed colors in theme B (possible theme leak)
  const themeLeak = await p.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'B');
    const nav = document.querySelector('.demo-section .nav a');
    const themeBtn = document.querySelector('.theme-bar .theme-btn:not(.active)');
    const cs = (el) => el ? { color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor } : null;
    return { navA: cs(nav), themeBtn: cs(themeBtn) };
  });
  console.log('Theme B leak check:', JSON.stringify(themeLeak));

  // 2) Persian digits font usage: the KPI values
  const digits = await p.evaluate(() => {
    const kpi = document.querySelector('.kpi .v');
    const num = document.querySelector('.num');
    return { kpiFont: getComputedStyle(kpi).fontFamily, kpiText: kpi.textContent, numFont: num ? getComputedStyle(num).fontFamily : null };
  });
  console.log('Digit fonts:', JSON.stringify(digits));

  // 3) Table header alignment in RTL
  const tableAlign = await p.evaluate(() => {
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.toggle('active', x.id === 'components'));
    const th = document.querySelector('.table th');
    const td = document.querySelector('.table td');
    return { thAlign: getComputedStyle(th).textAlign, tdAlign: getComputedStyle(td).textAlign, dir: document.documentElement.dir };
  });
  console.log('Table align (RTL):', JSON.stringify(tableAlign));

  // 4) Check which CSS classes exist that I'll fix: badge-gold usage, tooltip, empty-state
  const usage = await p.evaluate(() => {
    const classes = ['badge-gold', 'badge-aqua', 'tooltip', 'empty-state', 'error-state', 'btn-lg', 'sidebar'];
    const out = {};
    classes.forEach(c => out[c] = document.querySelectorAll('.' + c).length);
    return out;
  });
  console.log('Class usage in DOM:', JSON.stringify(usage));

  await b.close(); server.close();
});
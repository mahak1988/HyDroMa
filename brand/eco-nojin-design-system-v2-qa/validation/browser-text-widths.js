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
  const p = await b.newPage();
  await p.goto(base, { waitUntil: 'networkidle' });
  const data = await p.evaluate(async () => {
    await document.fonts.ready;
    const files = ['eco-nojin-option-01.svg','eco-nojin-option-02.svg','eco-nojin-option-03.svg','hydroma-option-01.svg','hydroma-option-02.svg','hydroma-option-03.svg','marketplace-option-01.svg','marketplace-option-02.svg','marketplace-option-03.svg'];
    const out = [];
    for (const f of files) {
      const txt = await (await fetch('/assets/images/' + f)).text();
      const holder = document.createElement('div'); holder.style.cssText = 'position:absolute;left:-9999px';
      holder.innerHTML = txt.replace(/<\?xml[^>]*\?>/, ''); document.body.appendChild(holder);
      const svg = holder.querySelector('svg');
      for (const t of svg.querySelectorAll('text')) {
        out.push({ file: f, text: t.textContent.trim(), fam: t.getAttribute('font-family').split(',')[0], w: t.getAttribute('font-weight'), size: t.getAttribute('font-size'), track: t.getAttribute('letter-spacing') || '0', width: +t.getComputedTextLength().toFixed(2) });
      }
      holder.remove();
    }
    return out;
  });
  console.log(JSON.stringify(data, null, 1));
  await b.close(); server.close();
});
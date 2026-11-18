const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/`;
  let b;
  try {
    b = await chromium.launch({ channel: 'chrome' });
    const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
    await p.goto(base, { waitUntil: 'networkidle' });
    const files = fs.readdirSync(path.join(ROOT, 'logo-tests')).filter(f => f.endsWith('.outlined.svg'));
    for (const of_ of files) {
      const orig = of_.replace('.outlined.svg', '.svg');
      await p.setContent(`
        <html><head><style>
          body{background:#fff;font-family:sans-serif;margin:0;padding:20px}
          .row{display:flex;gap:20px;margin-bottom:24px;align-items:flex-start}
          .cell{flex:1;border:1px solid #ddd;padding:8px}
          .cell h4{margin:0 0 6px;font-size:12px;color:#555}
          img{width:100%;height:auto;display:block;background:#fff}
        </style></head><body>
          <div class="row">
            <div class="cell"><h4>ORIGINAL (text) — ${orig}</h4><img src="${base}assets/images/${orig}"></div>
            <div class="cell"><h4>OUTLINED (paths) — ${of_}</h4><img src="${base}logo-tests/${of_}"></div>
          </div>
        </body></html>`);
      await p.waitForTimeout(500);
      const out = path.join(ROOT, 'logo-tests', of_.replace('.outlined.svg', '.compare.png'));
      await p.screenshot({ path: out, fullPage: true });
      // measure ink of both to confirm near-equivalence
      const ink = await p.evaluate(async () => {
        const imgs = [...document.querySelectorAll('img')];
        await Promise.all(imgs.map(i => i.decode().catch(() => {})));
        const res = [];
        for (const img of imgs) {
          const c = document.createElement('canvas');
          c.width = 600; c.height = Math.round(600 * img.naturalHeight / img.naturalWidth);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          const d = ctx.getImageData(0, 0, c.width, c.height).data;
          let dark = 0, total = 0;
          for (let i = 0; i < d.length; i += 4) { total++; if (d[i] < 128) dark++; }
          res.push(+(dark / total).toFixed(4));
        }
        return res;
      });
      const diff = Math.abs(ink[0] - ink[1]);
      console.log(`${orig}  origInk=${ink[0]}  outlinedInk=${ink[1]}  absDiff=${diff.toFixed(4)}  ${diff < 0.01 ? 'OK' : 'CHECK'}`);
    }
    await b.close();
    server.close();
  } catch (e) { console.error(e); if (b) await b.close(); server.close(); process.exit(1); }
});
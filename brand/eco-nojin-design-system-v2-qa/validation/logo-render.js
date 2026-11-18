const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

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
  try {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto(base, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const small = await p.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')].filter(i => i.src.endsWith('.svg'));
    await Promise.all(imgs.map(i => i.decode().catch(() => {})));
    const out = [];
    for (const img of imgs) {
      const c = document.createElement('canvas');
      const targetH = 32; const scale = targetH / img.naturalHeight;
      c.width = Math.round(img.naturalWidth * scale); c.height = targetH;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let dark = 0, total = 0;
      for (let i = 0; i < d.length; i += 4) { total++; if (d[i] < 128 && d[i + 1] < 128 && d[i + 2] < 128) dark++; }
      out.push({ file: img.src.split('/').pop(), w: c.width, h: c.height, darkRatio: +(dark / total).toFixed(4) });
    }
    // Also test font-independence: render each SVG inline after deleting @font-face, compare
    return out;
  });
  console.log('=== 32px render ===');
  console.log(JSON.stringify(small, null, 1));

  // Font-independence proof: render SVG text with and without the webfont loaded
  const dep = await p.evaluate(async () => {
    const results = [];
    const svgs = [...document.querySelectorAll('img')].filter(i => i.src.endsWith('.svg'));
    // measure a text element width in an inline copy with webfont vs with font-family forced to fallback
    for (const img of svgs) {
      const res = await fetch(img.src); const txt = await res.text();
      // inline it
      const holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;left:-9999px;top:0';
      holder.innerHTML = txt.replace(/<\?xml[^>]*\?>/, '');
      document.body.appendChild(holder);
      const svg = holder.querySelector('svg');
      const textEls = [...svg.querySelectorAll('text')];
      const widths = textEls.map(t => ({ txt: t.textContent.slice(0, 20), w: +t.getComputedTextLength().toFixed(1) }));
      results.push({ file: img.src.split('/').pop(), textCount: textEls.length, widths: widths.slice(0, 4) });
      holder.remove();
    }
    return results;
  });
  console.log('\n=== SVG text elements (font-dependent) ===');
  console.log(JSON.stringify(dep, null, 1));
  await b.close();
  server.close();
  } catch (e) { console.error(e); server.close(); process.exit(1); }
});
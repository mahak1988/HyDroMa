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

async function measure(page) {
  return await page.evaluate(async () => {
    await document.fonts.ready;
    const svgs = [...document.querySelectorAll('img')].filter(i => i.src.endsWith('.svg'));
    const out = [];
    for (const img of svgs) {
      const res = await fetch(img.src); const txt = await res.text();
      const holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;left:-9999px;top:0';
      holder.innerHTML = txt.replace(/<\?xml[^>]*\?>/, '');
      document.body.appendChild(holder);
      const svg = holder.querySelector('svg');
      const texts = [...svg.querySelectorAll('text')].map(t => ({ txt: t.textContent.slice(0, 18), w: +t.getComputedTextLength().toFixed(1), ff: t.getAttribute('font-family') }));
      out.push({ file: img.src.split('/').pop(), texts: texts.slice(0, 3), total: texts.length });
      holder.remove();
    }
    return out;
  });
}

server.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/`;
  let b;
  try {
    // 1) Normal load (webfonts available)
    b = await chromium.launch({ channel: 'chrome' });
    const ctx1 = await b.newContext({ viewport: { width: 1200, height: 900 } });
    const p1 = await ctx1.newPage();
    await p1.goto(base, { waitUntil: 'networkidle' });
    const withFonts = await measure(p1);
    await ctx1.close();

    // 2) Block all font files → fallback fonts
    const ctx2 = await b.newContext({ viewport: { width: 1200, height: 900 } });
    const p2 = await ctx2.newPage();
    await p2.route('**/*.woff2', r => r.abort());
    await p2.goto(base, { waitUntil: 'networkidle' });
    const noFonts = await measure(p2);
    await ctx2.close();
    await b.close();

    console.log('=== LOGO TEXT WIDTH: with webfonts vs with fonts BLOCKED ===');
    for (let i = 0; i < withFonts.length; i++) {
      const wf = withFonts[i], nf = noFonts[i];
      console.log('\n' + wf.file);
      const n = Math.min(wf.texts.length, nf.texts.length, 3);
      for (let j = 0; j < n; j++) {
        const a = wf.texts[j], c = nf.texts[j];
        const diff = a.w - c.w;
        const pct = ((diff / c.w) * 100).toFixed(1);
        console.log(`  "${a.txt}" webfont=${a.w}px  fallback=${c.w}px  diff=${diff.toFixed(1)}px (${pct}%)`);
      }
    }
  } catch (e) { console.error(e); if (b) await b.close(); server.close(); process.exit(1); }
  server.close();
});
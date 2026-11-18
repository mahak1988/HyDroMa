const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const imgDir = path.resolve(__dirname, '..', 'assets', 'images');

const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.svg'));
const src = {};
for (const f of files) {
  const t = fs.readFileSync(path.join(imgDir, f), 'utf8');
  src[f] = {
    hasText: /<text[\s>]/.test(t),
    hasPath: /<path[\s>]/.test(t),
    fontFamilies: [...new Set([...t.matchAll(/font-family="([^"]+)"/g)].map(m => m[1]))],
    hasRect: /<rect[\s>]/.test(t),
    hasCircle: /<circle[\s>]/.test(t),
    hasLine: /<line[\s>]/.test(t),
    hasSymbolOrImage: /<symbol[\s>]|<image[\s>]|<use[\s>]/.test(t),
    viewBox: (t.match(/viewBox="([^"]+)"/) || [])[1],
    hasTitle: /<title[\s>]/.test(t),
    hasDesc: /<desc[\s>]/.test(t),
  };
}
console.log('=== SVG source analysis ===');
console.log(JSON.stringify(src, null, 1));

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto(fileUrl, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
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
      try { ctx.drawImage(img, 0, 0, c.width, c.height); } catch (e) { out.push({ file: img.src.split('/').pop(), err: e.message }); continue; }
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let dark = 0, total = 0;
      for (let i = 0; i < d.length; i += 4) { total++; if (d[i] < 128 && d[i + 1] < 128 && d[i + 2] < 128) dark++; }
      out.push({ file: img.src.split('/').pop(), w: c.width, h: c.height, naturalW: img.naturalWidth, naturalH: img.naturalHeight, darkRatio: +(dark / total).toFixed(4) });
    }
    return out;
  });
  console.log('\n=== rendered at 32px height (legibility proxy) ===');
  console.log(JSON.stringify(small, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
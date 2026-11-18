const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

// Render text in a given font at large size, measure ink pixels (darkness) and width.
// A missing glyph renders as tofu box (hollow rectangle) or blank; a real glyph has more varied pixels.
async function glyphStats(page, text, font) {
  return await page.evaluate(async ({ text, font }) => {
    await document.fonts.ready;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const size = 80;
    c.width = 1200; c.height = 140;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#000';
    ctx.font = `${size}px ${font}`;
    ctx.textBaseline = 'top';
    ctx.fillText(text, 10, 20);
    const img = ctx.getImageData(0, 0, c.width, c.height).data;
    let dark = 0, total = 0;
    for (let i = 0; i < img.length; i += 4) { total++; if (img[i] < 128) dark++; }
    // measure text width
    const m = ctx.measureText(text);
    // tofu detection: count connected dark runs in the first glyph row band is complex;
    // simpler: ratio of dark pixels. A string of N tofu boxes has roughly uniform low-ish ink.
    return { font, darkRatio: +(dark / total).toFixed(4), width: +m.width.toFixed(1), hasInk: dark > 50 };
  }, { text, font });
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 800, height: 200 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const fonts = ['Vazirmatn', 'Estedad', 'Fraunces', 'Manrope', 'DM Sans', 'IBM Plex Mono'];
  const samples = { fa: 'اکو نوژین', en: 'Eco Nojin', digits: '0123456789' };
  const results = {};
  for (const f of fonts) {
    results[f] = {};
    for (const k of Object.keys(samples)) {
      // force load a specific face by using it; measure
      results[f][k] = await glyphStats(page, samples[k], `'${f}', monospace`);
    }
  }
  console.log(JSON.stringify(results, null, 1));
  fs.writeFileSync(path.join(__dirname, 'font-glyph-stats.json'), JSON.stringify(results, null, 2));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
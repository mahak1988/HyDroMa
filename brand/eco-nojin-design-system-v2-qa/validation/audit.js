// Independent QA audit harness for Eco Nojin Design System v2
// Measures: console/page errors, failed requests, horizontal overflow, element boxes,
// font loading (document.fonts), and computed colors for contrast.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, '..', 'validation');

function srgb(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function lum(r, g, b) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function contrast(rgb1, rgb2) {
  const L1 = lum(...rgb1), L2 = lum(...rgb2);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return +(((hi + 0.05) / (lo + 0.05))).toFixed(2);
}
function parseRGB(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}
// Composite a possibly-translucent fg over an opaque bg
function over(fg, bg) {
  const a = fg.a;
  return [
    Math.round(fg.r * a + bg[0] * (1 - a)),
    Math.round(fg.g * a + bg[1] * (1 - a)),
    Math.round(fg.b * a + bg[2] * (1 - a)),
  ];
}

async function collect(page, label) {
  const data = await page.evaluate(() => {
    const res = { vw: innerWidth, vh: innerHeight, dir: document.documentElement.dir, lang: document.documentElement.lang, theme: document.documentElement.getAttribute('data-theme') };
    res.docScrollW = document.documentElement.scrollWidth;
    res.bodyScrollW = document.body.scrollWidth;
    res.overflowX = document.documentElement.scrollWidth > innerWidth + 1;

    // Elements wider than viewport (overflow culprits)
    const wide = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > innerWidth + 1 || r.left < -1) {
        wide.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 70),
          id: el.id || '',
          left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
          text: (el.textContent || '').trim().slice(0, 40),
        });
      }
    });
    res.overflowEls = wide.slice(0, 40);

    // Text clipping: scrollWidth > clientWidth on elements with text
    const clip = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          clip.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50), text: el.textContent.trim().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth });
        }
      }
    });
    res.clipped = clip.slice(0, 40);

    // Visible interactive elements for focus/keyboard audit
    const focusables = [];
    document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]').forEach(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none') {
        focusables.push({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || '',
          text: (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 40),
          cls: (el.className || '').toString().slice(0, 50),
          hasLabel: !!(el.labels && el.labels.length) || !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby'),
          tabIndex: el.tabIndex,
          disabled: el.disabled === true,
        });
      }
    });
    res.focusables = focusables;
    return res;
  });
  return { label, ...data };
}

// Collect text nodes with effective fg/bg colors for contrast checking
async function collectContrast(page) {
  return await page.evaluate(() => {
    function parse(s) {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map(x => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function effBg(el) {
      // walk up until opaque bg found
      let node = el;
      let stack = [];
      while (node && node !== document.documentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
        node = node.parentElement;
      }
      let base = [255, 255, 255];
      // composite from bottom-most upward (reverse)
      for (let i = stack.length - 1; i >= 0; i--) {
        const c = stack[i];
        base = [
          Math.round(c.r * c.a + base[0] * (1 - c.a)),
          Math.round(c.g * c.a + base[1] * (1 - c.a)),
          Math.round(c.b * c.a + base[2] * (1 - c.a)),
        ];
      }
      return base;
    }
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (!t) continue;
      const el = n.parentElement;
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // only visible in viewport-ish and within active tab panel
      const fg = parse(cs.color);
      if (!fg) continue;
      const bg = effBg(el);
      const fs = parseFloat(cs.fontSize);
      const fw = parseInt(cs.fontWeight) || 400;
      const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      out.push({
        text: t.slice(0, 50),
        sel: el.tagName.toLowerCase() + (el.className ? '.' + (el.className || '').toString().trim().split(/\s+/).join('.') : ''),
        fg: [Math.round(fg.r), Math.round(fg.g), Math.round(fg.b)],
        fgRaw: cs.color,
        bg,
        fontSize: fs,
        fontWeight: fw,
        large,
        visible: r.bottom > 0 && r.top < innerHeight * 4,
      });
    }
    return out;
  });
}

async function fontReport(page) {
  return await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [];
    document.fonts.forEach(f => faces.push({ family: f.family, weight: f.weight, status: f.status, style: f.style }));
    // check actual glyph rendering availability
    const loaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
    return { faces, loadedCount: loaded.length, loaded: [...new Set(loaded)] };
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = { generatedAt: new Date().toISOString(), baseUrl: URL, viewports: {}, themes: {}, fonts: null, errors: {} };

  const widths = [375, 480, 768, 1024, 1440, 1920];
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('requestfailed', r => errs.push('requestfailed: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    results.viewports[w] = await collect(page, 'w' + w);
    results.viewports[w].errors = errs;
    results.viewports[w].fonts = await fontReport(page);
    if (w === 375 || w === 1440) {
      results.themes[w] = {};
      for (const th of ['A', 'B']) {
        await page.evaluate(t => { document.documentElement.setAttribute('data-theme', t); }, th);
        await page.waitForTimeout(200);
        const contrast = await collectContrast(page);
        const themeVals = await page.evaluate(() => {
          const cs = getComputedStyle(document.documentElement);
          const names = ['--brand-primary','--brand-secondary','--brand-accent','--page-bg','--surface','--header-bg','--header-text','--neutral-ink','--neutral-slate','--neutral-line','--neutral-cloud','--product-hydroma','--product-marketplace'];
          const o = {};
          names.forEach(n => o[n] = cs.getPropertyValue(n).trim());
          o.bodyFont = getComputedStyle(document.body).fontFamily;
          o.bodyColor = getComputedStyle(document.body).color;
          return o;
        });
        results.themes[w][th] = { contrast: contrast.slice(0, 400), tokens: themeVals };
      }
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'audit-raw.json'), JSON.stringify(results, null, 2));
  console.log('AUDIT_DONE');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
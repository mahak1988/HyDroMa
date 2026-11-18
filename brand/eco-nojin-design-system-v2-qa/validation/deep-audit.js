// Deep QA: per-section contrast (both themes), keyboard, RTL/LTR, theme, screenshots
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, '..', 'validation');
const SHOTS = path.resolve(__dirname, '..', 'screenshots');

function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(r, g, b) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function ratio(a, b) { const L1 = lum(...a), L2 = lum(...b); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return +(((hi + 0.05) / (lo + 0.05))).toFixed(2); }

async function setSection(page, id) {
  await page.evaluate((sid) => {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === sid));
  }, id);
  await page.waitForTimeout(120);
}

async function contrastForActivePanel(page) {
  return await page.evaluate(() => {
    function parse(s) { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
    function effBg(el) {
      let node = el, stack = [];
      while (node && node !== document.documentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
        node = node.parentElement;
      }
      let base = [255, 255, 255];
      for (let i = stack.length - 1; i >= 0; i--) { const c = stack[i]; base = [Math.round(c.r * c.a + base[0] * (1 - c.a)), Math.round(c.g * c.a + base[1] * (1 - c.a)), Math.round(c.b * c.a + base[2] * (1 - c.a))]; }
      return base;
    }
    const panel = document.querySelector('.tab-panel.active');
    const out = [];
    if (!panel) return out;
    const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim(); if (!t) continue;
      const el = n.parentElement; if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
      const fg = parse(cs.color); if (!fg) continue;
      const bg = effBg(el);
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight) || 400;
      const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      out.push({ text: t.slice(0, 55), sel: el.tagName.toLowerCase() + (el.className ? '.' + (el.className || '').toString().trim().split(/\s+/).join('.') : ''), fg: [Math.round(fg.r), Math.round(fg.g), Math.round(fg.b)], bg, fontSize: fs, fontWeight: fw, large });
    }
    return out;
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = { sections: {}, keyboard: {}, rtl: {}, theme: {}, overflowBySize: {}, focusSamples: {} };

  // ---------- 1. Per-section contrast, both themes, desktop ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const ids = await page.evaluate(() => [...document.querySelectorAll('.tab-panel')].map(p => p.id));
  for (const id of ids) {
    await setSection(page, id);
    report.sections[id] = {};
    for (const th of ['A', 'B']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), th);
      await page.waitForTimeout(150);
      const samples = await contrastForActivePanel(page);
      const rows = samples.map(s => { const need = s.large ? 3.0 : 4.5; const r = ratio(s.fg, s.bg); return { ...s, need, ratio: r, pass: r >= need }; });
      report.sections[id][th] = { total: rows.length, fails: rows.filter(x => !x.pass) };
    }
  }
  await ctx.close();

  // ---------- 2. Keyboard focus order + visibility ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const seq = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40), cls: (el.className || '').toString().slice(0, 45), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, boxShadow: cs.boxShadow, visible: r.width > 0 && r.height > 0, inViewport: r.top >= 0 && r.bottom <= innerHeight };
      });
      seq.push(info);
    }
    report.keyboard.focusOrder = seq;
    // Shift+Tab from start
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press('Shift+Tab');
    report.keyboard.shiftTab = await page.evaluate(() => { const el = document.activeElement; return { tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 40) }; });
    // Escape behavior
    await page.keyboard.press('Escape');
    report.keyboard.escapeNoCrash = true;
    // Skip link present?
    report.keyboard.skipLink = await page.evaluate(() => !!document.querySelector('a[href^="#"][class*="skip"], .skip-link, a[href="#main"]'));
    // landmarks
    report.keyboard.landmarks = await page.evaluate(() => ({ header: document.querySelectorAll('header,.app-header').length, nav: document.querySelectorAll('nav').length, main: document.querySelectorAll('main,.app-main').length, footer: document.querySelectorAll('footer').length, h1: document.querySelectorAll('h1').length }));
    // heading hierarchy
    report.keyboard.headings = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName + ':' + h.textContent.trim().slice(0, 45)));
    // aria
    report.keyboard.aria = await page.evaluate(() => ({ roleAttrs: document.querySelectorAll('[role]').length, ariaLabel: document.querySelectorAll('[aria-label]').length, ariaLabelledby: document.querySelectorAll('[aria-labelledby]').length, ariaLive: document.querySelectorAll('[aria-live]').length, tablist: document.querySelectorAll('[role=tablist]').length, tab: document.querySelectorAll('[role=tab]').length, tabpanel: document.querySelectorAll('[role=tabpanel]').length }));
    // form labels
    report.keyboard.unlabeledInputs = await page.evaluate(() => [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(el => !(el.labels && el.labels.length) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el => el.tagName + ':' + (el.name || el.id || el.placeholder || '?')));
    // SVG accessibility
    report.keyboard.svgA11y = await page.evaluate(() => [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') })));
    await ctx.close();
  }

  // ---------- 3. RTL / LTR / locales ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    for (const loc of ['fa', 'en', 'ar']) {
      await page.click(`.locale-btn[data-locale="${loc}"]`);
      await page.waitForTimeout(200);
      report.rtl[loc] = await page.evaluate(() => {
        const de = document.documentElement;
        const cs = getComputedStyle(document.body);
        const over = document.documentElement.scrollWidth > innerWidth + 1;
        // check a few RTL-sensitive computed props
        const nav = document.querySelector('.app-header .nav');
        const navcs = nav ? getComputedStyle(nav) : null;
        return {
          htmlDir: de.getAttribute('dir'), htmlLang: de.getAttribute('lang'),
          bodyDirection: cs.direction,
          bodyFont: cs.fontFamily,
          overflowX: over,
          navMarginInlineStart: navcs ? navcs.marginInlineStart : null,
          navFloat: navcs ? navcs.cssFloat : null,
          localeActive: [...document.querySelectorAll('.locale-btn')].filter(b => b.classList.contains('active')).map(b => b.dataset.locale),
        };
      });
    }
    await ctx.close();
  }

  // ---------- 4. Theme switcher: persistence + full token diff ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const tokenNames = ['--brand-primary','--brand-secondary','--brand-accent','--product-hydroma','--product-marketplace','--neutral-ink','--neutral-slate','--neutral-line','--neutral-cloud','--page-bg','--surface','--header-bg','--header-text'];
    const readTokens = () => page.evaluate((names) => { const cs = getComputedStyle(document.documentElement); const o = {}; names.forEach(n => o[n] = cs.getPropertyValue(n).trim()); o.bodyFont = getComputedStyle(document.body).fontFamily; o.btnPrimaryBg = getComputedStyle(document.querySelector('.btn-primary')).backgroundColor; o.btnPrimaryColor = getComputedStyle(document.querySelector('.btn-primary')).color; o.cardBg = getComputedStyle(document.querySelector('.card')).backgroundColor; o.headerBg = getComputedStyle(document.querySelector('.app-header')).backgroundColor; o.statusValBg = getComputedStyle(document.querySelector('.status-validated')).backgroundColor; return o; }, tokenNames);
    report.theme.A = await readTokens();
    await page.click('.theme-btn[data-theme="B"]');
    await page.waitForTimeout(250);
    report.theme.B = await readTokens();
    report.theme.persisted = await page.evaluate(() => localStorage.getItem('en-theme'));
    // reload → should keep B
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    report.theme.afterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // component-level check: any component that ignores theme (compare computed bg of surface-bound components)
    report.theme.components = await page.evaluate(() => {
      const sels = ['.card','.kpi','.demo-section','.theme-btn','.badge-blue','.btn-primary','.app-header','.footer','footer','.product-card','.scientific-card','.alert-info','.table','.input'];
      const o = {};
      sels.forEach(s => { const el = document.querySelector(s); if (el) { const cs = getComputedStyle(el); o[s] = { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor }; } });
      return o;
    });
    await ctx.close();
  }

  // ---------- 5. Overflow per size, all sections, both locales ----------
  {
    for (const w of [375, 480, 768, 1024, 1440, 1920]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      report.overflowBySize[w] = {};
      for (const loc of ['fa', 'en']) {
        await page.click(`.locale-btn[data-locale="${loc}"]`);
        await page.waitForTimeout(150);
        report.overflowBySize[w][loc] = {};
        for (const id of ids) {
          await setSection(page, id);
          const r = await page.evaluate(() => {
            const de = document.documentElement;
            const wide = [];
            document.querySelectorAll('.tab-panel.active *').forEach(el => { const b = el.getBoundingClientRect(); if (b.width > 0 && (b.right > innerWidth + 1 || b.left < -1)) wide.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 50), right: Math.round(b.right), left: Math.round(b.left) }); });
            return { scrollW: de.scrollWidth, overflowX: de.scrollWidth > innerWidth + 1, wide: wide.slice(0, 15) };
          });
          report.overflowBySize[w][loc][id] = r;
        }
      }
      await ctx.close();
    }
  }

  // ---------- 6. Screenshots ----------
  {
    const shot = async (w, h, name, setup) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      if (setup) await setup(page);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOTS, name), fullPage: false });
      await ctx.close();
    };
    const dir = (p) => fs.mkdirSync(p, { recursive: true });
    // responsive per width (overview)
    for (const w of [375, 480, 768, 1024, 1440, 1920]) {
      await shot(w, 900, path.join('responsive', `overview-${w}.png`));
    }
    // theme A/B overview
    await shot(1440, 900, path.join('theme-a', 'overview-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'A')); });
    await shot(1440, 900, path.join('theme-b', 'overview-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'B')); });
    // theme A/B on a component-heavy section
    await shot(1440, 900, path.join('theme-a', 'components-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'A')); await setSection(p, 'components'); });
    await shot(1440, 900, path.join('theme-b', 'components-1440.png'), async p => { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'B')); await setSection(p, 'components'); });
    // rtl / ltr
    await shot(1440, 900, path.join('rtl', 'fa-1440.png'), async p => { await p.click('.locale-btn[data-locale="fa"]'); });
    await shot(1440, 900, path.join('ltr', 'en-1440.png'), async p => { await p.click('.locale-btn[data-locale="en"]'); });
    await shot(1440, 900, path.join('rtl', 'ar-1440.png'), async p => { await p.click('.locale-btn[data-locale="ar"]'); });
    // small-screen section shots for clipping review
    await shot(375, 812, path.join('responsive', 'components-375.png'), async p => { await setSection(p, 'components'); });
    await shot(375, 812, path.join('responsive', 'science-375.png'), async p => { await setSection(p, 'science'); });
  }

  fs.writeFileSync(path.join(OUT, 'deep-audit.json'), JSON.stringify(report, null, 2));
  console.log('DEEP_DONE');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
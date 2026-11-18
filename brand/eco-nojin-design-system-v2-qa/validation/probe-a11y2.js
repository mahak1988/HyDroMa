const { chromium } = require('playwright');
const path = require('path');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 375, height: 812 } });
  await p.goto(fileUrl, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('.tab-panel').forEach(x => x.classList.toggle('active', x.id === 'a11y')));
  await p.waitForTimeout(100);
  const r = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('.tab-panel.active *').forEach(el => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || b.width === 0) return;
      if (b.right > vw + 0.5 || b.left < -0.5) out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40), left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), sw: el.scrollWidth, cw: el.clientWidth, txt: (el.textContent || '').trim().slice(0, 30) });
    });
    // also the alert chain
    const alert = document.querySelector('.tab-panel.active .alert');
    const chain = [];
    let n = alert;
    while (n && n !== document.body) { const b = n.getBoundingClientRect(); chain.push({ tag: n.tagName.toLowerCase(), cls: (n.className || '').toString().slice(0, 30), left: +b.left.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), sw: n.scrollWidth, cw: n.clientWidth, pad: getComputedStyle(n).padding, disp: getComputedStyle(n).display }); n = n.parentElement; }
    return { vw, offenders: out.slice(0, 10), alertChain: chain };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
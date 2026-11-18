const { chromium } = require('playwright');
const path = require('path');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage();
  await p.goto(fileUrl, { waitUntil: 'networkidle' });
  const r = await p.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts];
    const errs = [];
    for (const f of faces) { try { await f.load(); } catch (e) { errs.push({ fam: f.family, w: f.weight, err: e.message }); } }
    const still = [...document.fonts].filter(f => f.status !== 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.status);
    // check specific high weights actually render distinct from 400 (synthesis check)
    return { faceCount: faces.length, errs, stillUnloaded: still };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
// Build a browsable screenshot index for the five generated apps.
//   node scripts/build-screenshot-index.mjs
//
// Outputs:
//   SCREENSHOTS-2026-11-19.html                      (repo root, links all apps)
//   apps/<app>/artifacts/visual-review/sheets-2026-11-19.html
//   apps/<app>/artifacts/visual-review/contact-sheet-<app>-2026-11-19.png  (best effort)
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);
const { chromium } = requireFromHere("playwright-core");

const ROOT = resolve(import.meta.dirname, "..");
const STAMP = "2026-11-19";

const APPS = [
  { id: "console", title: "Console — identity & organizations (users, organizations, DataTable, guard)" },
  { id: "portal", title: "Portal — public website (12 prerendered routes, fa/en)" },
  { id: "marketplace", title: "Marketplace — catalog, product, cart, checkout, orders, seller dashboard" },
  { id: "tourism", title: "Tourism — destinations, nomadic, stays, experiences, map, host, bookings" },
  { id: "scientific-workspace", title: "Scientific workspace — dashboard, water, soil, climate, vegetation, map, simulation" },
];

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#eef1ee;color:#111;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.sheet{max-width:1400px;margin:0 auto 26px;background:#fff;padding:22px 26px 30px;border:1px solid #cfd8d2}
header{border-bottom:2px solid #0f6b4f;padding-bottom:8px;margin-bottom:14px}
h1{margin:0 0 3px;font-size:20px}
header p{margin:0;font-size:11.5px;color:#55665e}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#0f6b4f;margin:22px 0 9px}
.grid{display:grid;gap:12px}
.grid.desktop{grid-template-columns:repeat(2,1fr)}
.grid.mobile{grid-template-columns:repeat(4,1fr)}
figure{margin:0}
img{display:block;width:100%;height:auto;border:1px solid #c7d4cc;border-radius:6px;background:#fff}
.grid.mobile img{max-height:420px;width:auto;margin:0 auto}
figcaption{margin-top:5px;font-size:10px;color:#55665e;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-all}
a{color:#0f6b4f}
`;

function pngs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b));
}

const indexLinks = [];
const summary = [];

for (const app of APPS) {
  const shotsDir = resolve(ROOT, "apps", app.id, "artifacts", "screenshots");
  const files = pngs(shotsDir);
  if (files.length === 0) {
    summary.push({ app: app.id, files: 0 });
    continue;
  }

  const desktop = files.filter((file) => file.endsWith("-desktop.png"));
  const mobile = files.filter((file) => file.endsWith("-mobile.png"));

  const figure = (file) =>
    `<figure><a href="../screenshots/${file}" target="_blank"><img loading="lazy" src="../screenshots/${file}" alt="${file}"></a><figcaption>${file}</figcaption></figure>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${app.title}</title><style>${CSS}</style></head><body>
<section class="sheet">
<header><h1>${app.title}</h1>
<p>${files.length} screenshots · ${desktop.length} desktop · ${mobile.length} mobile · generated ${STAMP} · demo data</p></header>
<h2>Desktop (1440×1000, full page)</h2>
<div class="grid desktop">${desktop.map(figure).join("\n")}</div>
<h2>Mobile (390×844)</h2>
<div class="grid mobile">${mobile.map(figure).join("\n")}</div>
</section></body></html>`;

  const reviewDir = resolve(ROOT, "apps", app.id, "artifacts", "visual-review");
  mkdirSync(reviewDir, { recursive: true });
  const htmlPath = resolve(reviewDir, `sheets-${STAMP}.html`);
  writeFileSync(htmlPath, html, "utf8");

  indexLinks.push({ app, files, desktop, mobile, htmlPath });
  summary.push({ app: app.id, files: files.length, desktop: desktop.length, mobile: mobile.length });
}

// Top-level index.
const sections = indexLinks
  .map(
    (entry) => `
<section class="sheet">
<header><h1>${entry.app.title}</h1>
<p>${entry.files} screenshots · <a href="${entry.htmlPath.replace(/\\/g, "/")}">open full sheet</a></p></header>
<h2>Desktop</h2>
<div class="grid desktop">${entry.desktop
      .slice(0, 6)
      .map(
        (file) =>
          `<figure><a href="apps/${entry.app.id}/artifacts/screenshots/${file}" target="_blank"><img loading="lazy" src="apps/${entry.app.id}/artifacts/screenshots/${file}" alt="${file}"></a><figcaption>${file}</figcaption></figure>`,
      )
      .join("\n")}</div>
</section>`,
  )
  .join("\n");

const indexHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Eco Nojin — screenshot index ${STAMP}</title><style>${CSS}</style></head><body>
${sections}
</body></html>`;

const indexPath = resolve(ROOT, `SCREENSHOTS-${STAMP}.html`);
writeFileSync(indexPath, indexHtml, "utf8");

// Best-effort contact-sheet PNGs.
const browser = await chromium.launch({ channel: "chrome", headless: true });
const sheets = [];
for (const entry of indexLinks) {
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`file:///${entry.htmlPath.replace(/\\/g, "/")}`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    const out = resolve(ROOT, "apps", entry.app.id, "artifacts", "visual-review", `contact-sheet-${entry.app.id}-${STAMP}.png`);
    await page.screenshot({ path: out, fullPage: true });
    await page.close();
    sheets.push(out);
  } catch (error) {
    console.error(`contact sheet failed for ${entry.app.id}: ${String(error).slice(0, 200)}`);
  }
}
await browser.close();

console.log(JSON.stringify({ summary, indexPath, sheets }, null, 1));
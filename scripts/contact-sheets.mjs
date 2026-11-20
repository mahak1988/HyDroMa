// Builds contact sheets from a capture run so a reviewer can see every page at
// once. Input: artifacts/screenshots-*/metrics.json, output: sheet-*.png.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const requireHere = createRequire(import.meta.url);
const { chromium } = requireHere("playwright-core");

const ROOT = resolve(import.meta.dirname, "..");
const dir = resolve(ROOT, process.argv[2] ?? "");
if (!existsSync(join(dir, "metrics.json"))) {
  console.error(`no metrics.json in ${dir}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(join(dir, "metrics.json"), "utf8"));
const results = data.results.filter((item) => item.screenshot);

const groups = new Map();
for (const item of results) {
  if (!groups.has(item.app)) groups.set(item.app, []);
  groups.get(item.app).push(item);
}

function page(title, items, columns) {
  const cells = items
    .map((item) => {
      const flags = [];
      if (!item.h1) flags.push("no h1");
      if ((item.overflowX ?? 0) > 1) flags.push(`overflow ${item.overflowX}px`);
      if ((item.textLength ?? 0) < 40) flags.push("empty");
      if ((item.brokenImages ?? 0) > 0) flags.push(`${item.brokenImages} broken img`);
      if ((item.errors ?? []).length > 0) flags.push(`${item.errors.length} console errors`);
      const badge = flags.length > 0 ? `<span class="bad">${flags.join(" · ")}</span>` : `<span class="ok">ok</span>`;
      const label = `${item.path} · ${item.locale}/${item.theme}/${item.viewport}`;
      return `<figure>
        <img src="${item.screenshot}" alt="${label}" loading="eager" />
        <figcaption><b>${item.app}</b> ${label}<br />${badge} <span class="meta">h=${item.pageHeight ?? "?"} text=${item.textLength ?? "?"} dir=${item.dir ?? "?"}</span></figcaption>
      </figure>`;
    })
    .join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
  <style>
    :root { color-scheme: light; }
    body { margin:0; background:#0f1720; color:#e6edf3; font:13px/1.4 "Segoe UI", system-ui, sans-serif; }
    h1 { font-size:18px; margin:18px 22px 6px; }
    .grid { display:grid; grid-template-columns:repeat(${columns}, 1fr); gap:14px; padding:14px 22px 28px; }
    figure { margin:0; background:#161d27; border:1px solid #26303c; border-radius:8px; overflow:hidden; }
    img { width:100%; display:block; background:#fff; }
    figcaption { padding:6px 8px; font-size:11px; color:#b6c2cf; }
    .bad { color:#ff9b8a; font-weight:600; }
    .ok { color:#6ee7a8; font-weight:600; }
    .meta { color:#7d8b99; }
  </style></head><body><h1>${title} — ${items.length} views</h1><div class="grid">${cells}</div></body></html>`;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function shoot(name, items, columns, width) {
  const html = page(name, items, columns);
  const file = join(dir, `${name}.html`);
  writeFileSync(file, html, "utf8");
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const pageView = await context.newPage();
  await pageView.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await pageView.waitForTimeout(600);
  await pageView.screenshot({ path: join(dir, `sheet-${name}.png`), fullPage: true });
  const height = await pageView.evaluate(() => document.querySelector(".grid")?.scrollHeight ?? 0);
  await context.close();
  console.log(`sheet-${name}.png  (${items.length} views, ~${height}px)`);
}

// One sheet per app: desktop first, then mobile.
for (const [app, items] of groups) {
  const ordered = [...items].sort((a, b) => {
    if (a.viewport !== b.viewport) return a.viewport === "desktop" ? -1 : 1;
    return String(a.path).localeCompare(String(b.path));
  });
  await shoot(app, ordered, 3, 1500);
}

// Overview: every app landing page, desktop + mobile.
const roots = results.filter((item) => item.path === item.path.split("/").slice(0, 2).join("/") || item.path === "/");
const overview = results.filter(
  (item) => item.viewport === "desktop" && (item.path === "/" || item.path.split("/").filter(Boolean).length === 1),
);
await shoot("overview", overview, 3, 1500);

await browser.close();
console.log(`\n${roots.length} landing views, ${results.length} total views`);

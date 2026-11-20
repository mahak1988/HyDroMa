// Visual QA pass: crawl every app on the unified host, screenshot each page in
// several locale/theme/viewport combinations, and record measurable problems
// (overflow, console errors, failed requests, broken images, missing h1).
//
// Usage: node scripts/capture-all.mjs [--out artifacts/screenshots-YYYY-MM-DD]
// Requires: `npm run build:all` and `npm run preview` (port 5180) already running.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const requireHere = createRequire(import.meta.url);
const { chromium } = requireHere("playwright-core");

const ROOT = resolve(import.meta.dirname, "..");
const BASE = process.env.SITE_URL ?? "http://localhost:5180";
const stamp = new Date().toISOString().slice(0, 10);
const OUT = resolve(ROOT, process.argv[2] ?? join("artifacts", `screenshots-${stamp}`));
mkdirSync(OUT, { recursive: true });

const apps = JSON.parse(readFileSync(join(ROOT, "packages", "configuration", "apps.json"), "utf8"));
const byId = Object.fromEntries(apps.map((app) => [app.id, app]));

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 1000 },
  { tag: "mobile", width: 390, height: 844 },
];

/** Locale/theme combos: the full matrix for landing pages, one combo elsewhere. */
const PRIMARY = { locale: "fa", theme: "light" };
const EXTRA = [
  { locale: "fa", theme: "dark" },
  { locale: "en", theme: "light" },
  { locale: "ar", theme: "light" },
];

const MAX_PAGES = 30;

const slugify = (path) =>
  (path === "/" ? "root" : path.replace(/^\/+|\/+$/gu, "")).replace(/[^\p{L}\p{N}]+/gu, "-");

function inside(pathname, base) {
  if (base === "/") return true;
  return pathname === base.replace(/\/$/u, "") || pathname.startsWith(base);
}

/** Links inside the app prefix, without query/hash, de-duplicated. */
async function discover(page, app) {
  const found = new Set();
  const start = app.path;
  const queue = [{ path: start, depth: 0 }];
  const seen = new Set([start]);

  while (queue.length > 0 && found.size < MAX_PAGES) {
    const current = queue.shift();
    const target = `${BASE}${current.path}`;
    try {
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 12_000 }).catch(() => {});
      await page.waitForTimeout(250);
      found.add(current.path === app.path.replace(/\/$/u, "") ? app.path : current.path);
    } catch {
      continue;
    }
    if (current.depth >= 2) continue;

    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((anchor) => anchor.getAttribute("href")),
    );
    for (const href of links) {
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) continue;
      const path = href.split("#")[0].split("?")[0];
      if (!path.startsWith("/") || seen.has(path)) continue;
      if (!inside(path, app.path)) continue;
      seen.add(path);
      queue.push({ path, depth: current.depth + 1 });
    }
  }

  return [...found].slice(0, MAX_PAGES);
}

async function capture(browser, app, path, combo, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(
    (options) => {
      try {
        window.localStorage.setItem("eco.locale", options.locale);
        window.localStorage.setItem("eco.theme", options.theme);
        // Render gated surfaces as their signed-in demo role.
        window.localStorage.setItem("eco.tourism.host", "1");
        window.localStorage.setItem("eco.market.role", "seller");
      } catch {
        /* storage blocked */
      }
    },
    { locale: combo.locale, theme: combo.theme },
  );

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`${error.name}: ${String(error.message).slice(0, 160)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text().slice(0, 160)}`);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    if (!failure.includes("ERR_ABORTED")) errors.push(`request: ${request.url().slice(0, 120)} ${failure}`);
  });

  const url = `${BASE}${path}`;
  let status = null;
  let screenshot = null;
  let metrics = {};

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    status = response?.status() ?? null;
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 12_000 }).catch(() => {});
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve())).catch(() => {});
    await page.waitForTimeout(500);

    metrics = await page.evaluate(() => {
      const doc = document.scrollingElement ?? document.documentElement;
      const images = [...document.images];
      const h1 = document.querySelector("h1");
      const main = document.querySelector("main") ?? document.body;
      return {
        h1: h1 ? (h1.innerText || "").trim().replace(/\s+/gu, " ").slice(0, 120) : null,
        textLength: (main.innerText || "").trim().length,
        overflowX: Math.max(0, (doc.scrollWidth ?? 0) - (doc.clientWidth ?? 0)),
        pageHeight: doc.scrollHeight ?? 0,
        images: images.length,
        brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
        imagesMissingAlt: images.filter((image) => !image.hasAttribute("alt")).length,
        headings: document.querySelectorAll("h1,h2,h3").length,
        dir: document.documentElement.getAttribute("dir"),
        locale: document.documentElement.getAttribute("lang"),
        title: document.title,
      };
    });

    const finalPath = new URL(page.url()).pathname;
    const name = `${app.id}__${slugify(finalPath)}__${combo.locale}-${combo.theme}-${viewport.tag}.png`;
    const file = join(OUT, name);
    await page.screenshot({
      path: file,
      fullPage: viewport.tag === "desktop" && (metrics.pageHeight ?? 0) < 4200,
    });
    screenshot = name;
  } catch (error) {
    errors.push(`capture: ${String(error.message).slice(0, 160)}`);
  } finally {
    await context.close();
  }

  return { app: app.id, path, ...combo, viewport: viewport.tag, status, screenshot, ...metrics, errors };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const discovery = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const discoveryPage = await discovery.newPage();

const routes = {};
for (const app of apps) {
  process.stdout.write(`discover ${app.id} … `);
  // The entry page links to every other app, so crawling it would duplicate the
  // whole site under "home"; it is a single page by design.
  routes[app.id] = app.id === "home" ? [app.path] : await discover(discoveryPage, app);
  console.log(`${routes[app.id].length} pages`);
}
await discovery.close();

const results = [];
for (const app of apps) {
  for (const path of routes[app.id]) {
    const isRoot = path === app.path;
    const combos = isRoot ? [PRIMARY, ...EXTRA] : [PRIMARY];
    for (const combo of combos) {
      const viewports = isRoot ? VIEWPORTS : [VIEWPORTS[0]];
      for (const viewport of viewports) {
        const result = await capture(browser, app, path, combo, viewport);
        results.push(result);
        const flag = result.errors.length > 0 || (result.overflowX ?? 0) > 1 ? "!" : " ";
        process.stdout.write(`${flag} ${app.id}${path} ${combo.locale}/${combo.theme}/${viewport.tag}\n`);
      }
    }
  }
}

// Brand tabs are state, not routes: capture each tab explicitly.
const brandContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await brandContext.addInitScript((options) => {
  window.localStorage.setItem("eco.locale", options.locale);
  window.localStorage.setItem("eco.theme", options.theme);
}, PRIMARY);
const brandPage = await brandContext.newPage();
await brandPage.goto(`${BASE}/brand/`, { waitUntil: "domcontentloaded" });
const tabs = await brandPage.evaluate(() => [...document.querySelectorAll(".brand__tab")].map((button) => button.textContent?.trim() ?? ""));
for (let index = 0; index < tabs.length; index += 1) {
  const buttons = brandPage.locator(".brand__tab");
  await buttons.nth(index).click();
  await brandPage.waitForTimeout(400);
  const name = `brand__tab-${index + 1}-${slugify(tabs[index] ?? String(index + 1))}__fa-light-desktop.png`;
  await brandPage.screenshot({ path: join(OUT, name) });
  results.push({
    app: "brand",
    path: `/brand/#tab-${index + 1}`,
    ...PRIMARY,
    viewport: "desktop",
    status: 200,
    screenshot: name,
    tab: tabs[index],
    errors: [],
  });
}
await brandContext.close();
await browser.close();

writeFileSync(join(OUT, "metrics.json"), JSON.stringify({ base: BASE, capturedAt: new Date().toISOString(), results }, null, 2));

const problems = results.filter(
  (result) => result.errors.length > 0 || (result.overflowX ?? 0) > 1 || (result.textLength ?? 0) < 40 || !result.h1,
);
console.log(`\ncaptured ${results.length} screenshots in ${OUT}`);
console.log(`pages with a problem: ${problems.length}`);
for (const problem of problems.slice(0, 40)) {
  console.log(
    `  ${problem.app}${problem.path} [${problem.locale}/${problem.theme}/${problem.viewport}] ` +
      `h1=${problem.h1 ? "yes" : "NO"} overflow=${problem.overflowX} text=${problem.textLength} errors=${problem.errors.length}`,
  );
}

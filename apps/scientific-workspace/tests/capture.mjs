import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);
const { chromium } = requireFromHere("playwright-core");

const BASE = process.env.SCIENCE_URL ?? "http://localhost:5177";
const OUT = resolve(process.cwd(), "artifacts/screenshots");
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["/", "dashboard"],
  ["/water", "water"],
  ["/soil", "soil"],
  ["/climate", "climate"],
  ["/vegetation", "vegetation"],
  ["/remote-sensing", "remote"],
  ["/map", "map"],
  ["/simulation", "simulation"],
  ["/projects", "projects"],
];
const VIEWPORTS = [
  { w: 1440, h: 1000, tag: "desktop" },
  { w: 390, h: 844, tag: "mobile" },
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
let captured = 0;
const failures = [];

for (const locale of ["fa", "en"]) {
  for (const viewport of VIEWPORTS) {
    for (const [path, name] of ROUTES) {
      const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
      await context.addInitScript(
        (options) => {
          window.localStorage.setItem("eco.locale", options.locale);
          window.localStorage.setItem("eco.theme", "light");
        },
        { locale },
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(String(error).slice(0, 160)));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text().slice(0, 160));
      });
      page.on("requestfailed", (request) => errors.push(`REQFAIL ${request.url().slice(0, 80)}`));

      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
      if (name === "map" || name === "remote") {
        await page.locator("canvas.maplibregl-canvas").first().waitFor({ state: "visible", timeout: 30_000 });
      }
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${OUT}/${locale}-${name}-${viewport.tag}.png`,
        fullPage: viewport.tag === "desktop",
      });

      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
      );
      if (overflow > 1 || errors.length > 0) failures.push({ locale, name, tag: viewport.tag, overflow, errors });
      captured += 1;
      await context.close();
    }
  }
}

await browser.close();
console.log(JSON.stringify({ captured, failures }, null, 1));
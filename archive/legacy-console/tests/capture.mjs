import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.POC_URL ?? "http://localhost:5175";
const OUT = resolve(process.cwd(), process.argv[2] ?? "artifacts/screenshots");
mkdirSync(OUT, { recursive: true });

const pages = [
  { path: "/", name: "home" },
  { path: "/components", name: "components" },
  { path: "/users", name: "users" },
  { path: "/organizations", name: "organizations" },
  { path: "/settings", name: "settings" },
  { path: "/notifications", name: "notifications" },
];
const viewports = [
  { width: 1440, height: 1000, tag: "desktop" },
  { width: 390, height: 844, tag: "mobile" },
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
let captured = 0;
const failures = [];

for (const locale of ["fa", "en", "ar"]) {
  for (const theme of ["light", "dark"]) {
    for (const pageDef of pages) {
      for (const viewport of viewports) {
        const context = await browser.newContext({ viewport });
        await context.addInitScript((options) => {
          window.localStorage.setItem("eco.locale", options.locale);
          window.localStorage.setItem("eco.theme", options.theme);
        }, { locale, theme });

        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text().slice(0, 200));
        });
        page.on("requestfailed", (request) =>
          errors.push(`REQUEST_FAILED ${request.url()} :: ${request.failure()?.errorText ?? "unknown"}`),
        );

        await page.goto(BASE + pageDef.path, { waitUntil: "domcontentloaded" });
        await page.locator("h1").waitFor({ state: "visible", timeout: 30_000 });
        await page.waitForTimeout(700);

        const file = `${OUT}/${locale}-${theme}-${pageDef.name}-${viewport.tag}.png`;
        await page.screenshot({ path: file, fullPage: viewport.tag === "desktop" });

        const overflow = await page.evaluate(
          () =>
            (document.scrollingElement?.scrollWidth ?? 0) -
            (document.scrollingElement?.clientWidth ?? 0),
        );

        if (overflow > 1 || errors.length > 0) {
          failures.push({ name: `${locale}-${theme}-${pageDef.name}-${viewport.tag}`, overflow, errors });
        }
        console.log(`${locale} ${theme} ${pageDef.name} ${viewport.tag}: overflow=${overflow} errors=${errors.length}`);
        captured += 1;
        await context.close();
      }
    }
  }
}

await browser.close();
console.log(`captured=${captured}`);
if (failures.length > 0) {
  console.log("FAILURES:", JSON.stringify(failures, null, 1));
  process.exitCode = 1;
}
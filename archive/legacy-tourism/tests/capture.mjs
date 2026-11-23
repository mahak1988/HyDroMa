import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);
const { chromium } = requireFromHere("playwright-core");

const BASE = process.env.TOURISM_URL ?? "http://localhost:5179";
const OUT = resolve(process.cwd(), "artifacts/screenshots");
const REVIEW = resolve(process.cwd(), "artifacts/visual-review");
mkdirSync(OUT, { recursive: true });
mkdirSync(REVIEW, { recursive: true });

const ROUTES = [
  ["/", "home"],
  ["/destinations", "destinations"],
  ["/destinations/kondor-village", "destination"],
  ["/nomadic", "nomadic"],
  ["/nomadic/taleghan-migration", "nomadic-detail"],
  ["/stays", "stays"],
  ["/stays/kondor-homestay", "stay"],
  ["/experiences", "experiences"],
  ["/experiences/kondor-harvest-walk", "experience"],
  ["/map", "map"],
  ["/events", "events"],
  ["/host", "host"],
  ["/book/stay/kondor-homestay", "book"],
  ["/bookings", "bookings"],
];
const VIEWPORTS = [
  { w: 1440, h: 1000, tag: "desktop" },
  { w: 390, h: 844, tag: "mobile" },
];

const DEMO_BOOKING = {
  id: "req-demo-1",
  kind: "stay",
  targetId: "stay-kondor-homestay",
  startDate: "2026-06-01",
  endDate: "2026-06-03",
  guests: 2,
  status: "requested",
  quote: { amountMinor: 8_400_000, currency: "IRR" },
  createdAt: "2026-11-19T08:10:00.000Z",
  demo: true,
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
let captured = 0;
const failures = [];
const shots = [];

for (const locale of ["fa", "en"]) {
  for (const viewport of VIEWPORTS) {
    for (const [path, name] of ROUTES) {
      const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
      await context.addInitScript(
        (options) => {
          window.localStorage.setItem("eco.locale", options.locale);
          window.localStorage.setItem("eco.theme", "light");
          window.localStorage.setItem("eco.tourism.bookings", JSON.stringify([options.booking]));
          // /host and /bookings are gated; sign in as the demo host so they render.
          window.localStorage.setItem("eco.tourism.host", "1");
        },
        { locale, booking: DEMO_BOOKING },
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text().slice(0, 200));
      });
      page.on("requestfailed", (request) => {
        if (!request.url().includes("favicon")) errors.push(`REQFAIL ${request.url().slice(0, 80)}`);
      });

      await page.goto(BASE + path, { waitUntil: "load" });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(450);
      if (name === "map" || name === "nomadic-detail" || name === "destination") {
        await page.locator("canvas").first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(700);
      }

      const file = `${locale}-${name}-${viewport.tag}.png`;
      await page.screenshot({ path: `${OUT}/${file}`, fullPage: viewport.tag === "desktop" });
      shots.push({ locale, name, tag: viewport.tag, path, file });

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

const groups = [];
for (const locale of ["fa", "en"]) {
  for (const tag of ["desktop", "mobile"]) {
    const figures = shots
      .filter((shot) => shot.locale === locale && shot.tag === tag)
      .map(
        (shot) =>
          `<figure class="${tag}"><img src="../screenshots/${shot.file}" alt="${locale} ${shot.name} ${tag}"><figcaption>${shot.path} · ${tag} · ${shot.file}</figcaption></figure>`,
      )
      .join("\n");
    groups.push(
      `<section class="sheet" data-name="tourism-${locale}-${tag}"><header><h1>Eco Nojin Tourism — ${locale.toUpperCase()} / ${tag}</h1><p>${ROUTES.length} routes · demo data · source: artifacts/screenshots</p></header><div class="grid ${tag}">${figures}</div></section>`,
    );
  }
}

writeFileSync(
  `${REVIEW}/_sheets.html`,
  `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#eef1ee;font-family:system-ui;color:#111}
.sheet{width:1100px;background:#fff;margin:0 auto 24px;padding:22px 26px 30px}
header{border-bottom:2px solid #0f6b4f;padding-bottom:8px;margin-bottom:14px}
h1{margin:0 0 3px;font-size:20px}header p{margin:0;font-size:11px;color:#55665e}
.grid{display:grid;gap:12px}.grid.desktop{grid-template-columns:repeat(3,1fr)}.grid.mobile{grid-template-columns:repeat(4,1fr)}
figure{margin:0}img{display:block;width:100%;border:1px solid #c7d4cc;border-radius:6px}
.grid.mobile img{max-height:380px;width:auto;margin:0 auto}
figcaption{margin-top:5px;font-size:9.5px;color:#55665e;font-family:ui-monospace,monospace;word-break:break-all}
</style></head><body>${groups.join("\n")}</body></html>`,
);

console.log(JSON.stringify({ captured, failures }, null, 1));
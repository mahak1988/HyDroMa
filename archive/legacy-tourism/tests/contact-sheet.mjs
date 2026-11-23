import { resolve } from "node:path";
import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);
const { chromium } = requireFromHere("playwright-core");

const REVIEW = resolve(process.cwd(), "artifacts/visual-review");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1160, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(`file:///${REVIEW.replace(/\\/g, "/")}/_sheets.html`, { waitUntil: "load" });

const sheets = page.locator("section.sheet");
const count = await sheets.count();
for (let index = 0; index < count; index += 1) {
  const sheet = sheets.nth(index);
  const name = (await sheet.getAttribute("data-name")) ?? `sheet-${index}`;
  await sheet.screenshot({ path: `${REVIEW}/${name}.png` });
}
await browser.close();
console.log(JSON.stringify({ contactSheets: count }));
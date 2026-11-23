import { test } from "@playwright/test";
import { ensureSignedIn } from "./auth.helper";

test.beforeEach(async ({ context }) => {
  await ensureSignedIn(context);
});

const PREFIX = process.env.SHOT_PREFIX ?? "";
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  for (const locale of ["en", "fa"]) {
    test(`screenshot ${vp.width}x${vp.height} ${locale}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.addInitScript((l: string) => {
        window.localStorage.setItem("eco.locale", l);
        window.localStorage.setItem("eco.theme", "light");
      }, locale);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `artifacts/screenshots/${PREFIX}${vp.width}x${vp.height}-${locale}.png`, fullPage: false });
    });
  }
}
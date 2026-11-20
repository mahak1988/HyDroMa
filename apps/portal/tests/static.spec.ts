import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

// Resolve `dist` relative to this file, not the process CWD. Launching the
// suite from the repo root (`npm run test:portal`) previously resolved
// `<root>/dist`, which never exists, so the whole static suite silently skipped
// and the prerender pipeline was never verified.
const DIST = resolve(import.meta.dirname, "..", "dist");
const STATIC_ENTRY = resolve(DIST, "index.html");
const ROUTES = ["/", "/ecosystem", "/hydroma", "/landscape", "/marketplace", "/tourism", "/mrv", "/knowledge", "/about", "/contact", "/partner", "/login"];

/**
 * F-17: a missing static build must never be reported as success.
 *
 * In CI the absence of `dist/index.html` is a hard failure — otherwise a
 * pipeline that forgot the prerender stage would report green while never
 * checking prerender, sitemap or robots. Locally (no CI) the suite still skips
 * with an actionable message so a plain `playwright test` stays usable; the
 * `pretest:e2e` hook normally builds the static output first, so in practice
 * the suite runs.
 */
const missingStaticOutput = !existsSync(STATIC_ENTRY);
if (missingStaticOutput && process.env.CI) {
  throw new Error(
    "Static output is missing: run `npm run build:portal:static` before the E2E stage. CI must not report success without verifying the prerendered pages, sitemap and robots.",
  );
}

test.describe("static output", () => {
  test.skip(missingStaticOutput, "run `npm run build:portal:static` first (or use `npm run test:e2e`)");

  test("home page is prerendered with content, meta and the app bundle", () => {
    const html = readFileSync(STATIC_ENTRY, "utf8");
    expect(html).toContain("<h1");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("og:title");
    expect(html).toContain("/assets/index-");
    expect(html).not.toContain("undefined");
  });

  test("every route has a static index.html with its own canonical", () => {
    for (const route of ROUTES.filter((item) => item !== "/")) {
      const file = resolve(DIST, route.slice(1), "index.html");
      expect(existsSync(file), `missing ${route}`).toBe(true);
      const html = readFileSync(file, "utf8");
      expect(html).toContain("<h1");
      expect(html).toMatch(new RegExp(`canonical"[^>]*${route}`));
    }
  });

  test("sitemap and robots are generated", () => {
    const sitemap = readFileSync(resolve(DIST, "sitemap.xml"), "utf8");
    expect((sitemap.match(/<url>/g) ?? []).length).toBe(ROUTES.length);
    const robots = readFileSync(resolve(DIST, "robots.txt"), "utf8");
    expect(robots).toContain("Sitemap:");
  });
});
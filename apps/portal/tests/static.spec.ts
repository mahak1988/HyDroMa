import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const DIST = resolve(process.cwd(), "dist");
const ROUTES = ["/", "/ecosystem", "/hydroma", "/landscape", "/marketplace", "/tourism", "/mrv", "/knowledge", "/about", "/contact", "/partner", "/login"];

test.describe("static output", () => {
  test.skip(!existsSync(resolve(DIST, "index.html")), "run `npm run build:portal:static` first");

  test("home page is prerendered with content, meta and the app bundle", () => {
    const html = readFileSync(resolve(DIST, "index.html"), "utf8");
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
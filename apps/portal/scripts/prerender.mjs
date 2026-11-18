// Static prerender for the public portal.
// Serves the built SPA locally, renders every route in Chrome, and writes real HTML files
// so the deployed output is static-first (content and meta tags in the HTML itself).
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const requireFromHere = createRequire(import.meta.url);
const { chromium } = requireFromHere("playwright-core");

const DIST = resolve(process.cwd(), "dist");
const PORT = 4177;
const SITE_URL = process.env.VITE_SITE_URL ?? "https://eco-nojin.example";

const ROUTES = [
  "/",
  "/ecosystem",
  "/hydroma",
  "/landscape",
  "/marketplace",
  "/tourism",
  "/mrv",
  "/knowledge",
  "/about",
  "/contact",
  "/partner",
  "/login",
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".json": "application/json",
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  let file = join(DIST, decodeURIComponent(url.pathname));
  try {
    if (!existsSync(file) || statSync(file).isDirectory()) {
      const index = join(file, "index.html");
      file = existsSync(index) ? index : join(DIST, "index.html");
    }
    response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("not found");
  }
});

await new Promise((resolveListen) => server.listen(PORT, "127.0.0.1", resolveListen));

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const results = [];

for (const route of ROUTES) {
  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "networkidle" });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);

  const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`);
  const target = route === "/" ? join(DIST, "index.html") : join(DIST, route, "index.html");
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, html, "utf8");
  results.push({ route, bytes: Buffer.byteLength(html), title: await page.title() });
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map((route) => `  <url><loc>${SITE_URL}${route}</loc></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap, "utf8");
writeFileSync(
  join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  "utf8",
);

await browser.close();
server.close();

console.log(JSON.stringify({ prerendered: results.length, results }, null, 1));
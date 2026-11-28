// Unified production host.
//
// Serves the built output of every live app from one origin and one port:
//   /            → apps/platform/dist   (public core + lazy sections)
//   /brand/      → apps/brand/dist
// Archived apps are not served: their routes live inside the platform SPA now.
import { createServer, request as httpRequest } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { readFileSync } from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = Number(process.env.PORT ?? 5180);
const apps = JSON.parse(readFileSync(path.join(ROOT, "packages", "configuration", "apps.json"), "utf8"))
  .filter((app) => app.status !== "archived");
const ordered = [...apps].sort((a, b) => b.path.length - a.path.length);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function match(url) {
  const target = (url ?? "/").split("?")[0] ?? "/";
  return ordered.find((app) => app.path === "/" || target.startsWith(app.path)) ?? ordered[ordered.length - 1];
}

async function fileAt(candidate) {
  try {
    const info = await stat(candidate);
    return info.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

async function resolveAsset(app, url) {
  const dist = path.join(ROOT, "apps", app.id, "dist");
  const pathname = decodeURIComponent((url ?? "/").split("?")[0] ?? "/");
  const relative = app.path === "/" ? pathname.slice(1) : pathname.slice(app.path.length);
  if (relative.includes("..")) return null;

  const clean = relative.replace(/^\/+|\/+$/gu, "");
  const candidates = clean === ""
    ? [path.join(dist, "index.html")]
    : [
        path.join(dist, clean),
        path.join(dist, clean, "index.html"),
        path.join(dist, `${clean}.html`),
        path.join(dist, "index.html"),
      ];

  for (const candidate of candidates) {
    const found = await fileAt(candidate);
    if (found) return found;
  }
  return null;
}

const server = createServer(async (req, res) => {
  // Same-origin API path: /api/* is proxied to the real Eco Nojin API service,
  // so session cookies stay same-site in production too.
  const pathname = (req.url ?? "/").split("?")[0] ?? "/";
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    const upstreamPath = (req.url ?? "/").replace(/^\/api/, "") || "/";
    const upstream = httpRequest(
      { host: "127.0.0.1", port: 8000, path: upstreamPath, method: req.method, headers: req.headers },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: { code: "api_unavailable", message: "The Eco Nojin API is not running.", message_key: "errors.api_unavailable", status: 502, retryable: true, correlation_id: null } }));
    });
    req.pipe(upstream);
    return;
  }

  // Same-origin HyDroMA engine path: /hydroma-api/* is proxied to the engine so
  // the production build never depends on an absolute loopback URL.
  if (pathname === "/hydroma-api" || pathname.startsWith("/hydroma-api/")) {
    const upstreamPath = (req.url ?? "/").replace(/^\/hydroma-api/, "") || "/";
    const upstream = httpRequest(
      { host: "127.0.0.1", port: 8000, path: upstreamPath, method: req.method, headers: req.headers },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: { code: "hydroma_unavailable", message: "The HyDroMA engine is not running.", message_key: "errors.hydroma_unavailable", status: 502, retryable: true, correlation_id: null } }));
    });
    req.pipe(upstream);
    return;
  }

  // A path without the trailing slash does not match its app prefix and would
  // fall through to the entry page; redirect so every surface has one URL.
  const bare = apps.find((app) => app.path !== "/" && app.path === `${pathname.replace(/\/+$/u, "")}/`);
  if (bare && pathname === bare.path.replace(/\/$/u, "")) {
    const query = (req.url ?? "").slice(pathname.length);
    res.writeHead(301, { location: `${bare.path}${query}` });
    res.end();
    return;
  }

  const app = match(req.url);
  const file = await resolveAsset(app, req.url);
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Not found: ${req.url}\nBuild the apps first: npm run build:all`);
    return;
  }
  try {
    const body = await readFile(file);
    const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    const immutable = file.includes(`${path.sep}assets${path.sep}`);
    res.writeHead(200, {
      "content-type": type,
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Failed to read ${file}: ${error.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`\n  Eco Nojin — unified host (production build)\n  http://localhost:${PORT}\n`);
  for (const app of apps) console.log(`  ${app.path.padEnd(14)} -> apps/${app.id}/dist`);
  console.log("");
});
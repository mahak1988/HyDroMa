// Unified development host.
//
// One user-facing port (5180). Every app keeps its own Vite server on an
// internal port, built with `APP_BASE=/<app>/`; this process proxies by path
// prefix and forwards the HMR websocket, so a single origin serves everything.
import { spawn } from "node:child_process";
import { request as httpRequest, createServer } from "node:http";
import { connect } from "node:net";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = 5180;
const pm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const isWindows = process.platform === "win32";

const apps = JSON.parse(await readFile(path.join(ROOT, "packages", "configuration", "apps.json"), "utf8"))
  // Archived apps are migrated into the platform SPA; their legacy bundle is no
  // longer served on the unified host.
  .filter((app) => app.status !== "archived");
// Longest prefix first so "/console/" wins over the "/" catch-all.
const ordered = [...apps].sort((a, b) => b.path.length - a.path.length);

// The real API service runs alongside the frontend stack. If something is
// already listening on 8000 (e.g. a manually started API), we leave it alone.
const children = apps.map((app) =>
  spawn(pm, ["--filter", `@eco-nojin/${app.id}`, "run", "dev"], {
    cwd: ROOT,
    env: { ...process.env, APP_BASE: app.path },
    stdio: "inherit",
    shell: isWindows,
  }),
);

function portInUse(port) {
  return new Promise((resolve) => {
    const request = httpRequest({ host: "127.0.0.1", port, path: "/health", method: "GET", timeout: 800 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.end();
  });
}

const apiInUse = await portInUse(8000);
if (apiInUse) {
  console.log("  API: an Eco Nojin API is already listening on :8000 — reusing it.");
} else {
  const api = spawn(process.execPath, ["services/api/src/server.mjs"], {
    cwd: ROOT,
    env: { ...process.env, PORT: "8000" },
    stdio: "inherit",
  });
  children.push(api);
  console.log("  API: started on http://127.0.0.1:8000 (pnpm run seed loads reference data)");
}

const pathOnly = (url = "/") => url.split("?")[0] ?? "/";

function match(url) {
  const target = pathOnly(url);
  return ordered.find((app) => app.path === "/" || target.startsWith(app.path)) ?? ordered[ordered.length - 1];
}

function unavailable(res, app) {
  if (res.headersSent) return res.end();
  res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
  res.end(`${app.id} is still starting (internal port ${app.devPort}). Retry in a moment.`);
}

const server = createServer((req, res) => {
  // Same-origin API path: the unified host proxies /api/* to the real Eco Nojin
  // API service, so session cookies stay same-site and no CORS is needed.
  if (pathOnly(req.url).startsWith("/api")) {
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
      res.end(JSON.stringify({ error: { code: "api_unavailable", message: "The Eco Nojin API is starting. Retry shortly.", message_key: "errors.api_unavailable", status: 502, retryable: true, correlation_id: null } }));
    });
    req.pipe(upstream);
    return;
  }

  // Same-origin HyDroMA engine path: the unified host proxies /hydroma-api/* to
  // the engine so the frontend never needs an absolute loopback URL.
  if (pathOnly(req.url).startsWith("/hydroma-api")) {
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
      res.end(JSON.stringify({ error: { code: "hydroma_unavailable", message: "The HyDroMA engine is unreachable.", message_key: "errors.hydroma_unavailable", status: 502, retryable: true, correlation_id: null } }));
    });
    req.pipe(upstream);
    return;
  }

  const app = match(req.url);
  const upstream = httpRequest(
    { host: "localhost", port: app.devPort, path: req.url, method: req.method, headers: req.headers },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on("error", () => unavailable(res, app));
  upstream.setTimeout(30_000, () => upstream.destroy());
  req.pipe(upstream);
});

// Vite's HMR client opens a websocket at the app base; forward it untouched.
server.on("upgrade", (req, socket, head) => {
  const app = match(req.url);
  const upstream = connect(app.devPort, "localhost", () => {
    const headers = Object.entries(req.headers)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join("\r\n");
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    if (head?.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});

server.listen(PORT, () => {
  console.log(`\n  Eco Nojin — unified host\n  http://localhost:${PORT}\n`);
  for (const app of apps) console.log(`  ${app.path.padEnd(14)} -> ${app.id} (internal ${app.devPort})`);
  console.log("");
});

function shutdown() {
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
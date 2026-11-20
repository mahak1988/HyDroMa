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
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const isWindows = process.platform === "win32";

const apps = JSON.parse(await readFile(path.join(ROOT, "packages", "configuration", "apps.json"), "utf8"));
// Longest prefix first so "/console/" wins over the "/" catch-all.
const ordered = [...apps].sort((a, b) => b.path.length - a.path.length);

const children = apps.map((app) =>
  spawn(npm, ["run", "dev", "--workspace", `@eco-nojin/${app.id}`], {
    cwd: ROOT,
    env: { ...process.env, APP_BASE: app.path },
    stdio: "inherit",
    shell: isWindows,
  }),
);

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
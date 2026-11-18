// Eco Nojin static preview server — zero dependencies.
// Serves ./dist over http. No network egress, no build step of its own.
// Usage: node serve.mjs [port]   (default 4173, or PORT env var)

import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlPath === '/') urlPath = '/index.html';

    let filePath = path.join(DIST, path.normalize(urlPath));
    if (!filePath.startsWith(DIST)) return send(res, 403, 'Forbidden');

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!existsSync(filePath)) {
      // SPA-style fallback to index.html for extensionless routes
      const fallback = path.join(DIST, 'index.html');
      if (!path.extname(urlPath) && existsSync(fallback)) filePath = fallback;
      else return send(res, 404, 'Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    createReadStream(filePath).pipe(res);
  } catch (err) {
    send(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Eco Nojin dev server running at http://localhost:${PORT}`);
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.log('  note: dist/index.html not found. Run "npm run build" first (or "npm run dev").');
  }
});
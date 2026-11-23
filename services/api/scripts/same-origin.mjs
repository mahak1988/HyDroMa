// One-off: add a same-origin /api proxy to every app's vite config and switch
// all frontend API base defaults to "/api" (the unified host proxies /api to
// the real API service). Same-origin requests make the session cookie work.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PROXY_BLOCK = `  server: {
    port: PORT_PLACEHOLDER,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, ""),
      },
    },
  },`;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (entry === "vite.config.ts") yield full;
  }
}

const patched = [];
for (const file of walk("apps")) {
  let s = readFileSync(file, "utf8");
  if (s.includes('"/api"')) {
    console.log("already proxied:", file);
    continue;
  }
  const portMatch = s.match(/server:\s*\{\s*port:\s*(\d+),\s*strictPort:\s*true\s*\}/);
  if (!portMatch) {
    console.log("no server block found:", file);
    continue;
  }
  s = s.replace(portMatch[0], PROXY_BLOCK.replace("PORT_PLACEHOLDER", portMatch[1]));
  writeFileSync(file, s);
  patched.push(file);
}
console.log("patched vite configs:", patched.length);

// Switch frontend API defaults from http://127.0.0.1:8000 to "/api".
const codeTargets = [
  "apps/console/src/session/Session.tsx",
  "apps/console/src/hooks/useConsoleData.ts",
  "apps/console/src/data/index.ts",
  "apps/marketplace/src/session/MarketSession.tsx",
  "apps/marketplace/src/main.tsx",
  "apps/tourism/src/main.tsx",
];
for (const file of codeTargets) {
  let s = readFileSync(file, "utf8");
  const before = s;
  s = s.split('import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"').join('import.meta.env.VITE_API_URL ?? "/api"');
  s = s.split('API_BASE = process.env.E2E_API_BASE ?? "http://127.0.0.1:8000"').join('API_BASE = process.env.E2E_API_BASE ?? "http://127.0.0.1:8000"');
  if (s !== before) {
    writeFileSync(file, s);
    console.log("api base -> /api:", file);
  }
}

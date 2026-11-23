// Builds every app for the unified host: `APP_BASE=/<app>/` so assets resolve
// under their prefix. The portal also prerenders, so its static pages win.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const pm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const apps = JSON.parse(readFileSync(path.join(ROOT, "packages", "configuration", "apps.json"), "utf8"))
  // Archived apps live in the platform SPA now; the legacy bundle is not built.
  .filter((app) => app.status !== "archived");

const results = [];
for (const app of apps) {
  const script = app.id === "portal" ? "build:static" : "build";
  process.stdout.write(`\n▶ ${app.id} (${app.path}) — pnpm run ${script}\n`);
  const code = await new Promise((resolve) => {
    const child = spawn(pm, ["--filter", `@eco-nojin/${app.id}`, "run", script], {
      cwd: ROOT,
      env: { ...process.env, APP_BASE: app.path },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (exit) => resolve(exit ?? 1));
  });
  results.push({ id: app.id, code });
}

console.log("\n── build summary ─────────────────────────────");
for (const result of results) {
  console.log(`  ${result.code === 0 ? "ok  " : "FAIL"}  ${result.id}`);
}
const failed = results.filter((result) => result.code !== 0);
if (failed.length > 0) {
  console.error(`\n${failed.length} app(s) failed to build.`);
  process.exit(1);
}
console.log("\nAll apps built. Start the host with: pnpm run preview\n");
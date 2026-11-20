import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const installedWorker = resolve(process.cwd(), "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const installedPackage = resolve(process.cwd(), "node_modules/maplibre-gl/package.json");
const vendoredWorker = resolve(process.cwd(), "packages/spatial/src/maplibre-gl-worker.mjs");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("MapLibre worker provenance", () => {
  const pkg = JSON.parse(readFileSync(installedPackage, "utf8")) as { version: string };

  it("matches the installed maplibre-gl worker byte-for-byte", () => {
    expect(
      sha256(vendoredWorker),
      "vendored worker does not match the installed maplibre-gl; refresh packages/spatial/src/maplibre-gl-worker.mjs",
    ).toBe(sha256(installedWorker));
  });

  it("declares the installed maplibre-gl version in its header", () => {
    const header = readFileSync(vendoredWorker, "utf8").slice(0, 600);
    expect(header).toContain(`maplibre-gl-js/blob/v${pkg.version}/`);
  });
});
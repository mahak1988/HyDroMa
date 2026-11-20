import { describe, expect, it } from "vitest";
import { APPS, PRODUCT_APPS, appById, appPath, isUnified, routerBasename, UNIFIED_PORT } from "../src";

describe("app registry", () => {
  it("describes every app exactly once", () => {
    const ids = APPS.map((app) => app.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "home",
      "platform",
      "portal",
      "console",
      "scientific-workspace",
      "marketplace",
      "tourism",
      "brand",
    ]);
  });

  it("keeps every public path and dev port unique", () => {
    expect(new Set(APPS.map((app) => app.path)).size).toBe(APPS.length);
    expect(new Set(APPS.map((app) => app.devPort)).size).toBe(APPS.length);
    expect(UNIFIED_PORT).not.toBe(APPS.find((app) => app.devPort === UNIFIED_PORT)?.devPort);
  });

  it("reserves / for the home page and nests the rest under a prefix", () => {
    expect(appById("home").path).toBe("/");
    for (const app of PRODUCT_APPS) {
      expect(app.path.startsWith("/")).toBe(true);
      expect(app.path.endsWith("/")).toBe(true);
      expect(app.path.length).toBeGreaterThan(1);
    }
  });

  it("normalises basenames for the router", () => {
    expect(routerBasename("/")).toBe("/");
    expect(routerBasename("/console/")).toBe("/console");
    expect(routerBasename("/science")).toBe("/science");
    expect(isUnified("/")).toBe(false);
    expect(isUnified("/console/")).toBe(true);
  });

  it("exposes a trailing-slash path for links", () => {
    expect(appPath("console")).toBe("/console/");
    expect(appPath("home")).toBe("/");
  });
});
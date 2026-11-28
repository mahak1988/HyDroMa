import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PAGES } from "../../../src/content/pages";
import { UI } from "../../../src/content/ui";
import { ordersFromGroups } from "../../../src/sections/market/store/orders";
import type { CartGroup } from "../../../src/sections/market/lib/cart-logic";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("demo isolation", () => {
  it("classifies every registry page and keeps an explicit demo entry", () => {
    const nonEmpty = PAGES.filter((page) => page.path !== "");
    expect(nonEmpty).toHaveLength(76);
    expect(PAGES).toHaveLength(77);
    for (const page of nonEmpty) {
      expect(page.path.trim()).toBe(page.path);
      expect(page.path.startsWith("/")).toBe(false);
      expect(page.path.startsWith("demo")).toBe(false);
    }
  });

  it("wraps registry pages in the demo boundary and exposes /platform/demo", () => {
    const router = read("apps/platform/src/app/router.tsx");
    expect(router).toContain("<DemoLayout />");
    expect(router).toContain('path: "demo"');
    expect(router).toContain("pageById(\"overview\")");
  });

  it("does not let demo pages write to the API", () => {
    const renderer = read("apps/platform/src/pages/PageRenderer.tsx");
    expect(renderer).not.toContain("createApiClient");
    expect(renderer).not.toContain("api.resources.create");
    expect(renderer).toContain("setCreateStatus(\"saved\")");
  });

  it("ships localized demo controls in fa/en/ar", () => {
    for (const key of ["close", "create", "saving", "saved", "error", "demoBanner", "demoBannerBody"] as const) {
      expect(UI[key].fa.length).toBeGreaterThan(0);
      expect(UI[key].en.length).toBeGreaterThan(0);
      expect(UI[key].ar.length).toBeGreaterThan(0);
    }
  });
});

describe("marketplace transaction integrity", () => {
  it("marks every locally created order as demo", () => {
    const group = {
      seller: { id: "seller-1", name: "Seller", slug: "seller" },
      lines: [{ product: { id: "p1", name: "P", sellerId: "seller-1", price: { amountMinor: 100, currency: "IRR" } }, quantity: 1, lineTotalMinor: 100 }],
      subtotalByCurrency: { IRR: 100 },
    } as unknown as CartGroup;
    const orders = ordersFromGroups([group], "standard");
    expect(orders).toHaveLength(1);
    expect(orders[0]?.demo).toBe(true);
  });

  it("keeps the authoritative catalog link and demo banner in the market layout", () => {
    const layout = read("apps/platform/src/sections/market/app/MarketLayout.tsx");
    expect(layout).toContain("/platform/marketplace");
    expect(layout).toContain("market.demoScope");
    const apiPage = read("apps/platform/src/sections/api-pages/MarketplacePage.tsx");
    expect(apiPage).toContain("useProducts()");
    expect(apiPage).toContain("useSellers()");
  });
});

describe("HyDroMA canonical workspace", () => {
  it("mounts a real run route under the platform workspace", () => {
    const router = read("apps/platform/src/app/router.tsx");
    expect(router).toContain('path: "hydroma/run"');
    expect(router).toContain("HydromaRunPage");
  });

  it("separates demo science under /science/demo and keeps real run/models outside", () => {
    const science = read("apps/platform/src/sections/science/app/router.tsx");
    expect(science).toContain('path="demo"');
    expect(science).toContain('path="run"');
    expect(science).toContain('path="models"');
    expect(science).toContain("ScienceDemoBoundary");
  });

  it("translates the HyDroMA run controls in fa/en/ar", () => {
    for (const locale of ["fa", "en", "ar"]) {
      const catalog = read(`packages/i18n/src/catalogs/${locale}.ts`);
      expect(catalog).toContain("openRun");
      expect(catalog).toContain("workspaceNote");
    }
    for (const locale of ["fa", "ar"]) {
      expect(read(`packages/i18n/src/catalogs/${locale}.ts`)).not.toMatch(/runModel:\s*"Run model"/);
    }
    expect(read("packages/i18n/src/catalogs/en.ts")).toMatch(/runModel:\s*"Run model"/);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const routerSource = readFileSync(
  path.join(root, "apps/scientific-workspace/src/app/router.tsx"),
  "utf8",
);

describe("scientific-workspace route integrity", () => {
  it("declares a catch-all route", () => {
    expect(routerSource).toMatch(/path:\s*"\*"/);
  });

  it("catch-all renders NotFoundPage, not the Dashboard (no misleading fallback)", () => {
    const after = routerSource.split('path: "*"')[1] ?? "";
    expect(after).toContain("NotFoundPage");
    expect(after).not.toContain("DashboardPage");
  });

  it("navigation targets all resolve to declared routes", () => {
    const layout = readFileSync(
      path.join(root, "apps/scientific-workspace/src/app/ScienceLayout.tsx"),
      "utf8",
    );
    const targets = [...layout.matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1] ?? "");
    for (const to of targets) {
      if (to === "" || to === "/") continue;
      const routePath = to.replace(/^\//, "");
      expect(routerSource).toContain(`path: "${routePath}"`);
    }
  });
});
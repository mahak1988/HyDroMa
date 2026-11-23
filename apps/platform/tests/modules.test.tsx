import { describe, expect, it } from "vitest";
import { createPlatformRegistry } from "../src/app/modules";
import { SECTIONS } from "../src/content/pages";

describe("platform modules", () => {
  it("registers one module per section", () => {
    const registry = createPlatformRegistry();
    expect(registry.list().length).toBe(SECTIONS.length);
  });
  it("has nav items", () => {
    const registry = createPlatformRegistry();
    expect(registry.navItems().length).toBeGreaterThan(0);
  });
});
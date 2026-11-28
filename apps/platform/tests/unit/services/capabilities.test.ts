import { describe, expect, it } from "vitest";
import {
  MODULE_CAPABILITIES,
  RESOURCE_TYPES,
  blockedModules,
  isResourceType,
  moduleById,
  resourceBackedModules,
} from "../../../src/services/capabilities";

describe("module capability registry", () => {
  it("covers all 18 product modules M01..M18", () => {
    const codes = MODULE_CAPABILITIES.map((m) => m.code);
    expect(codes).toHaveLength(18);
    expect(codes[0]).toBe("M01");
    expect(codes[17]).toBe("M18");
    expect(new Set(codes).size).toBe(18);
  });

  it("every module has a unique id and a /platform route", () => {
    const ids = MODULE_CAPABILITIES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const module of MODULE_CAPABILITIES) {
      expect(module.route.startsWith("/platform/")).toBe(true);
    }
  });

  it("resource-backed modules reference a real resource type", () => {
    for (const module of resourceBackedModules()) {
      expect(isResourceType(module.resourceType as string)).toBe(true);
      expect(module.api.length).toBeGreaterThan(0);
    }
  });

  it("blocked modules declare a precise missing capability and no fake api", () => {
    for (const module of blockedModules()) {
      expect(module.missing, `${module.id} needs a missing note`).toBeTruthy();
      expect(module.api).toEqual([]);
    }
  });

  it("exposes the full resource type whitelist", () => {
    expect(RESOURCE_TYPES).toContain("landscapes");
    expect(RESOURCE_TYPES).toContain("surveys");
    expect(isResourceType("landscapes")).toBe(true);
    expect(isResourceType("bogus")).toBe(false);
  });

  it("resolves modules by id", () => {
    expect(moduleById("hydroma")?.code).toBe("M04");
    expect(moduleById("does-not-exist")).toBeUndefined();
  });
});
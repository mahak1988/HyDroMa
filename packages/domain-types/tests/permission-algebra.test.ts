import { describe, expect, it } from "vitest";
import {
  buildPermission,
  checkPermissions,
  expandPermission,
  isPermissionGranted,
  parsePermission,
  permissionsForRole,
  requirementList,
} from "../src/permissions";

describe("parsePermission", () => {
  it("splits resource and operation", () => {
    expect(parsePermission("catalog:read")).toEqual({ resource: "catalog", operation: "read" });
  });

  it("rejects malformed strings", () => {
    expect(parsePermission("catalog")).toBeNull();
    expect(parsePermission(":read")).toBeNull();
    expect(parsePermission("catalog:")).toBeNull();
  });
});

describe("expandPermission", () => {
  it("expands manage into the four operations", () => {
    expect(expandPermission("orders:manage").sort()).toEqual([
      "orders:create",
      "orders:delete",
      "orders:read",
      "orders:update",
    ]);
  });

  it("expands write into read/create/update", () => {
    expect(expandPermission("catalog:write")).toContain("catalog:read");
    expect(expandPermission("catalog:write")).not.toContain("catalog:delete");
  });

  it("keeps a concrete permission unchanged", () => {
    expect(expandPermission("users:read")).toEqual(["users:read"]);
  });

  it("keeps the wildcard", () => {
    expect(expandPermission("*")).toEqual(["*"]);
  });
});

describe("isPermissionGranted", () => {
  it("grants everything through the wildcard", () => {
    expect(isPermissionGranted(["*"], "billing:manage")).toBe(true);
  });

  it("does not widen across resources", () => {
    expect(isPermissionGranted(["catalog:read"], "orders:read")).toBe(false);
  });

  it("honours implication", () => {
    expect(isPermissionGranted(["catalog:manage"], "catalog:delete")).toBe(true);
  });
});

describe("checkPermissions", () => {
  it("requires every permission by default", () => {
    expect(checkPermissions(["a:read"], ["a:read", "b:read"])).toBe(false);
  });

  it("accepts any when requireAll is false", () => {
    expect(checkPermissions(["a:read"], ["a:read", "b:read"], false)).toBe(true);
  });

  it("treats an empty requirement as satisfied", () => {
    expect(checkPermissions([], [])).toBe(true);
  });
});

describe("requirementList", () => {
  it("normalises a single permission to an array", () => {
    expect(requirementList({ permissions: "users:read" })).toEqual(["users:read"]);
    expect(requirementList({ permissions: ["a", "b"] })).toEqual(["a", "b"]);
    expect(requirementList(undefined)).toEqual([]);
  });
});

describe("permissionsForRole", () => {
  it("gives owner every key and viewer a strict subset", () => {
    const owner = permissionsForRole("owner");
    const viewer = permissionsForRole("viewer");
    expect(owner.length).toBeGreaterThan(viewer.length);
    expect(viewer.every((permission) => owner.includes(permission))).toBe(true);
  });

  it("buildPermission composes the canonical form", () => {
    expect(buildPermission("catalog", "read")).toBe("catalog:read");
  });
});
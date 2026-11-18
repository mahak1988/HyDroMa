import { describe, expect, it } from "vitest";
import { hasPermission, PERMISSION_KEYS, ROLE_PERMISSIONS } from "../src/permissions";

describe("permission matrix", () => {
  it("owner holds every permission", () => {
    for (const key of PERMISSION_KEYS) expect(hasPermission("owner", key)).toBe(true);
  });

  it("viewer is read-only", () => {
    expect(hasPermission("viewer", "org.read")).toBe(true);
    expect(hasPermission("viewer", "users.write")).toBe(false);
    expect(hasPermission("viewer", "org.members.invite")).toBe(false);
  });

  it("role scopes are ordered: owner ⊇ admin ⊇ manager ⊇ member", () => {
    const subset = (a: string, b: string) =>
      ROLE_PERMISSIONS[b as "admin"].every((p) => ROLE_PERMISSIONS[a as "owner"].includes(p));
    expect(subset("owner", "admin")).toBe(true);
    expect(subset("admin", "manager")).toBe(true);
    expect(subset("manager", "member")).toBe(true);
  });

  it("denies unknown roles by default", () => {
    expect(hasPermission("ghost" as "viewer", "org.read")).toBe(false);
  });
});
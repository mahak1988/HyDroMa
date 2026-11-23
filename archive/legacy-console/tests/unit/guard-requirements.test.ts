import { describe, expect, it } from "vitest";
import { readRequirements } from "@eco-nojin/auth-client";
import type { RouteRequirement } from "@eco-nojin/domain-types";

/**
 * Route-requirement composition.
 *
 * `readRequirements` collects every `handle` in the matched chain. The guard
 * then requires the union, so a child route can only narrow access. These tests
 * pin that contract: a child declaring a *different* permission must not drop
 * its parent's requirement.
 */
type Match = Parameters<typeof readRequirements>[0][number];

function chain(handles: Array<RouteRequirement | undefined>): Match[] {
  return handles.map((handle) => ({ handle }) as unknown as Match);
}

function permissionsOf(matches: Match[]): string[] {
  return readRequirements(matches).flatMap((requirement) =>
    Array.isArray(requirement.permissions)
      ? requirement.permissions
      : requirement.permissions
        ? [requirement.permissions]
        : [],
  );
}

describe("readRequirements", () => {
  it("collects requirements from every match, parent first", () => {
    const matches = chain([{ permissions: "users.read" }, { permissions: "org.read" }]);
    expect(permissionsOf(matches)).toEqual(["users.read", "org.read"]);
  });

  it("a child without a requirement inherits the parent's", () => {
    const matches = chain([{ permissions: "users.read" }, { labelKey: "nav.home" }]);
    expect(permissionsOf(matches)).toEqual(["users.read"]);
  });

  it("a child cannot drop or replace a weaker parent requirement", () => {
    const matches = chain([{ permissions: "users.read" }, { permissions: "catalog.read" }]);
    expect(permissionsOf(matches)).toEqual(["users.read", "catalog.read"]);
  });

  it("ignores handles that carry no requirement", () => {
    const matches = chain([undefined, { labelKey: "nav.home" }, { permissions: "users.read" }]);
    expect(permissionsOf(matches)).toEqual(["users.read"]);
  });

  it("returns an empty list for a public route", () => {
    expect(readRequirements(chain([undefined, undefined]))).toEqual([]);
  });

  it("surfaces bypass and redirectTo from any match", () => {
    const matches = chain([
      { permissions: "users.read", redirectTo: "/" },
      { permissions: "org.read", bypass: true },
    ]);
    const requirements = readRequirements(matches);
    expect(requirements.some((item) => item.bypass)).toBe(true);
    expect(requirements.find((item) => item.redirectTo)?.redirectTo).toBe("/");
  });
});
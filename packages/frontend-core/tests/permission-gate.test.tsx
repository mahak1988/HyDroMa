import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "../src/guard";
import { PermissionProvider, usePermissions } from "../src/permission";
import { checkPermissions } from "@eco-nojin/domain-types";
import type { ReactNode } from "react";

/**
 * Security contract for the authorization layer.
 *
 * The product rule is: a protected route must be fail-closed. When the
 * permission source has not resolved yet (empty grants), when it errors, or
 * when the caller is denied, the protected content must NOT render. These tests
 * pin that behaviour so a future "fail-open while loading" refactor is caught.
 */
function renderGate(options: {
  permissions?: Record<string, boolean> | string[];
  requirement?: { permissions?: string | string[]; requireAll?: boolean; redirectTo?: string; bypass?: boolean };
  allow?: boolean;
  bypass?: boolean;
  isFixture?: boolean;
}): { denied: boolean; granted: boolean } {
  const fallback = <p role="alert">DENIED</p>;
  const child = <p>PROTECTED</p>;

  render(
    <PermissionProvider
      permissions={options.permissions ?? {}}
      bypass={options.bypass ?? false}
      isFixture={options.isFixture ?? true}
    >
      <PermissionGate requirement={options.requirement} allow={options.allow} fallback={fallback}>
        {child}
      </PermissionGate>
    </PermissionProvider>,
  );

  return {
    denied: screen.queryByText("DENIED") !== null,
    granted: screen.queryByText("PROTECTED") !== null,
  };
}

describe("PermissionGate — fail-closed contract", () => {
  it("denies a protected route when grants have not loaded (empty)", () => {
    // Simulates the loading window: provider mounted, permissions unresolved.
    const result = renderGate({
      permissions: {},
      requirement: { permissions: "users.read" },
    });
    expect(result.granted).toBe(false);
    expect(result.denied).toBe(true);
  });

  it("denies when the provider reports an error state (no grants, fixture off)", () => {
    const result = renderGate({
      permissions: {},
      isFixture: false,
      requirement: { permissions: "users.read" },
    });
    expect(result.granted).toBe(false);
  });

  it("denies a valid signed-in user who lacks the permission", () => {
    const result = renderGate({
      permissions: { "users.read": true },
      requirement: { permissions: "org.update" },
    });
    expect(result.denied).toBe(true);
    expect(result.granted).toBe(false);
  });

  it("allows when the permission is granted", () => {
    const result = renderGate({
      permissions: { "users.read": true },
      requirement: { permissions: "users.read" },
    });
    expect(result.granted).toBe(true);
    expect(result.denied).toBe(false);
  });

  it("treats a route with no requirement as public", () => {
    const result = renderGate({ permissions: {}, requirement: undefined });
    expect(result.granted).toBe(true);
    expect(result.denied).toBe(false);
  });

  it("denies when allow=false even if the permission is granted", () => {
    const result = renderGate({
      permissions: { "users.read": true },
      requirement: { permissions: "users.read" },
      allow: false,
    });
    expect(result.granted).toBe(false);
  });
});

describe("PermissionGate — demo bypass is explicit and bounded", () => {
  it("bypass is off by default", () => {
    const result = renderGate({
      permissions: {},
      requirement: { permissions: "users.read" },
    });
    expect(result.granted).toBe(false);
  });

  it("provider-level bypass opens the gate (explicit opt-in)", () => {
    const result = renderGate({
      permissions: {},
      requirement: { permissions: "users.read" },
      bypass: true,
    });
    expect(result.granted).toBe(true);
  });

  it("requirement-level bypass opens only that route", () => {
    const result = renderGate({
      permissions: {},
      requirement: { permissions: "users.read", bypass: true },
    });
    expect(result.granted).toBe(true);
  });

  it("isFixture alone does NOT grant access", () => {
    const result = renderGate({
      permissions: {},
      requirement: { permissions: "users.read" },
      isFixture: true,
    });
    expect(result.granted).toBe(false);
  });
});

describe("permission algebra — implication and isolation", () => {
  it("manage implies read/create/update/delete", () => {
    expect(checkPermissions(["catalog:manage"], ["catalog:delete"])).toBe(true);
  });

  it("write does not imply delete", () => {
    expect(checkPermissions(["catalog:write"], ["catalog:delete"])).toBe(false);
  });

  it("does not widen across resources", () => {
    expect(checkPermissions(["catalog:read"], ["orders:read"])).toBe(false);
  });

  it("wildcard grants everything", () => {
    expect(checkPermissions(["*"], ["billing:manage"])).toBe(true);
  });

  it("a specific grant does not satisfy a wildcard requirement", () => {
    expect(checkPermissions(["catalog:read"], ["*"])).toBe(false);
  });

  it("requireAll=false requires only one", () => {
    expect(checkPermissions(["a:read"], ["a:read", "b:read"], false)).toBe(true);
    expect(checkPermissions([], ["a:read", "b:read"], false)).toBe(false);
  });

  it("an empty requirement is satisfied", () => {
    expect(checkPermissions([], [])).toBe(true);
  });
});

describe("usePermissions surface", () => {
  function Probe(): ReactNode {
    const { can, canAll, canAny } = usePermissions();
    return (
      <ul>
        <li data-testid="can">{String(can("users.read"))}</li>
        <li data-testid="canAll">{String(canAll(["users.read", "org.read"]))}</li>
        <li data-testid="canAny">{String(canAny(["users.read", "org.read"]))}</li>
      </ul>
    );
  }

  it("exposes can/canAll/canAny with all/any semantics", () => {
    render(
      <PermissionProvider permissions={["users.read"]}>
        <Probe />
      </PermissionProvider>,
    );
    expect(screen.getByTestId("can").textContent).toBe("true");
    expect(screen.getByTestId("canAll").textContent).toBe("false");
    expect(screen.getByTestId("canAny").textContent).toBe("true");
  });

  it("accepts a boolean map where false means explicitly denied", () => {
    render(
      <PermissionProvider permissions={{ "users.read": false }}>
        <Probe />
      </PermissionProvider>,
    );
    expect(screen.getByTestId("can").textContent).toBe("false");
  });
});
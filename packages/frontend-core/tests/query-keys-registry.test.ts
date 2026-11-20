import { describe, expect, it } from "vitest";
import { infiniteKey, invalidationKeys, queryKeysFactory, withScope } from "../src/query-keys";
import { Registry } from "../src/registry";

describe("queryKeysFactory", () => {
  const keys = queryKeysFactory("users");

  it("builds list and detail keys", () => {
    expect(keys.all).toEqual(["users"]);
    expect(keys.lists()).toEqual(["users", "list"]);
    expect(keys.list({ q: "sara" })).toEqual(["users", "list", { q: "sara" }]);
    expect(keys.details()).toEqual(["users", "detail"]);
    expect(keys.detail("usr-1")).toEqual(["users", "detail", "usr-1"]);
  });

  it("omits an undefined query so list keys collide correctly", () => {
    expect(keys.list()).toEqual(["users", "list"]);
  });
});

describe("withScope", () => {
  const keys = queryKeysFactory("users");

  it("prefixes the tenant id", () => {
    expect(withScope("org-1", keys.lists())).toEqual(["org-1", "users", "list"]);
  });

  it("is idempotent", () => {
    const once = withScope("org-1", keys.lists());
    expect(withScope("org-1", once)).toEqual(once);
  });

  it("is a no-op without a scope", () => {
    expect(withScope(undefined, keys.lists())).toEqual(keys.lists());
  });
});

describe("invalidationKeys", () => {
  const keys = queryKeysFactory("users");

  it("targets the list and, when given, the detail", () => {
    expect(invalidationKeys(keys)).toEqual([["users", "list"]]);
    expect(invalidationKeys(keys, "usr-1")).toEqual([
      ["users", "list"],
      ["users", "detail", "usr-1"],
    ]);
  });
});

describe("infiniteKey", () => {
  it("adds the shapes-differ suffix", () => {
    expect(infiniteKey(["users", "list"])).toEqual(["users", "list", "__infinite"]);
  });
});

describe("Registry", () => {
  it("registers and resolves values", () => {
    const registry = new Registry<{ name: string }>();
    registry.registerValue("a", { name: "A" });
    expect(registry.get("a")).toEqual({ name: "A" });
    expect(registry.get("missing")).toBeUndefined();
    expect(registry.size).toBe(1);
  });

  it("throws on duplicate when configured to", () => {
    const registry = new Registry<number>({ onDuplicate: "error" });
    registry.registerValue("a", 1);
    expect(() => registry.registerValue("a", 2)).toThrow(/duplicate id/);
  });

  it("resolves async loaders", async () => {
    const registry = new Registry<string>();
    registry.registerLoader("lazy", async () => "loaded");
    await expect(registry.getAsPromise("lazy")).resolves.toBe("loaded");
  });

  it("removes all entries owned by an owner", () => {
    const registry = new Registry<{ owner: string }>();
    registry.registerValue("a", { owner: "p1" });
    registry.registerValue("b", { owner: "p2" });
    registry.registerValue("c", { owner: "p1" });
    expect(registry.unregisterByOwner("p1", (item) => item.owner)).toBe(2);
    expect(registry.ids()).toEqual(["b"]);
  });
});
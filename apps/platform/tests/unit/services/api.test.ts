import { describe, expect, it } from "vitest";
import { createPlatformApiClient, resolveApiBase } from "../../../src/services/api";
import { createApiClient } from "@eco-nojin/api-client";

describe("platform api factory", () => {
  it("defaults to the same-origin /api base", () => {
    expect(resolveApiBase({} as unknown as ImportMetaEnv)).toBe("/api");
  });

  it("honours an explicit VITE_API_URL", () => {
    expect(resolveApiBase({ VITE_API_URL: "https://api.example.test" } as unknown as ImportMetaEnv)).toBe(
      "https://api.example.test",
    );
  });

  it("builds a client exposing the real endpoint namespaces", () => {
    const client = createPlatformApiClient("/api");
    expect(typeof client.auth.me).toBe("function");
    expect(typeof client.resources.list).toBe("function");
    expect(typeof client.catalog.products).toBe("function");
    // Newly added real namespaces.
    expect(typeof client.notifications.list).toBe("function");
    expect(typeof client.notifications.markSeen).toBe("function");
    expect(typeof client.models.list).toBe("function");
  });

  it("the shared client and the factory produce the same shape", () => {
    const a = createApiClient({ baseUrl: "/api" });
    const b = createPlatformApiClient("/api");
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort());
  });
});
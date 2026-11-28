import { describe, expect, it, vi } from "vitest";
import { createHydromaClient } from "@eco-nojin/hydroma-client";
import { HYDROMA_PROXY_PATH, resolveHydromaBaseUrl } from "../../../src/sections/science/services/hydromaBaseUrl";
import { createHydromaClient as createLocalHydromaClient } from "../../../src/sections/science/services/hydroma";

describe("HyDroMA base URL", () => {
  it("defaults to the same-origin proxy path", () => {
    expect(resolveHydromaBaseUrl(undefined)).toBe(HYDROMA_PROXY_PATH);
    expect(resolveHydromaBaseUrl("")).toBe(HYDROMA_PROXY_PATH);
    expect(resolveHydromaBaseUrl("   ")).toBe(HYDROMA_PROXY_PATH);
  });

  it("honours an explicit override", () => {
    expect(resolveHydromaBaseUrl("https://engine.example/")).toBe("https://engine.example/");
  });

  it("resolves the proxy path against the current origin", async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request) =>
        new Response(JSON.stringify({ models: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const client = createHydromaClient({
      baseUrl: resolveHydromaBaseUrl(undefined),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.models();
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe(`${HYDROMA_PROXY_PATH}/v1/models`);
  });

  it("local adapter keeps the proxy prefix (regression)", async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request) =>
        new Response(JSON.stringify({ models: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const client = createLocalHydromaClient({
      baseUrl: resolveHydromaBaseUrl(undefined),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.models();
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe(`${HYDROMA_PROXY_PATH}/v1/models`);
  });
});
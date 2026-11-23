import { describe, expect, it } from "vitest";

import { HydromaClientError, createHydromaClient } from "../src/services/hydroma";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const MODELS = {
  models: [
    { id: "eco-nojin.hydroma.water-balance", version: "1.1.0", domain: "water", maturity: "tested", scientific_status: "NOT_VALIDATED" },
    { id: "eco-nojin.hydroma.fao56-et0", version: "1.0.0", domain: "agriculture", maturity: "tested", scientific_status: "NOT_VALIDATED" },
  ],
};

const BASE = { baseUrl: "http://127.0.0.1:8000" };

describe("hydroma client (contract)", () => {
  it("parses and validates a real models response", async () => {
    const client = createHydromaClient({ ...BASE, fetchImpl: async () => jsonResponse(MODELS) });
    const res = await client.models();
    expect(res.models).toHaveLength(2);
    expect(res.models[0]?.id).toBe("eco-nojin.hydroma.water-balance");
  });

  it("rejects an invalid payload (models not an array)", async () => {
    const client = createHydromaClient({ ...BASE, fetchImpl: async () => jsonResponse({ models: "nope" }) });
    await expect(client.models()).rejects.toBeInstanceOf(HydromaClientError);
  });

  it("maps a network failure to 'network' (no demo fallback)", async () => {
    const client = createHydromaClient({
      ...BASE,
      fetchImpl: async () => {
        throw new TypeError("ECONNREFUSED");
      },
    });
    await expect(client.models()).rejects.toMatchObject({ reason: "network" });
  });

  it("maps a 503 to 'unavailable'", async () => {
    const client = createHydromaClient({ ...BASE, fetchImpl: async () => jsonResponse({}, 503) });
    await expect(client.models()).rejects.toMatchObject({ reason: "unavailable" });
  });

  it("parses health", async () => {
    const client = createHydromaClient({
      ...BASE,
      fetchImpl: async () => jsonResponse({ status: "ok", service: "hydroma", version: "0.1.0" }),
    });
    const h = await client.health();
    expect(h.status).toBe("ok");
  });

  it("maps a non-array models payload missing id to invalid_response", async () => {
    const client = createHydromaClient({ ...BASE, fetchImpl: async () => jsonResponse({ models: [{ version: "1.0.0" }] }) });
    await expect(client.models()).rejects.toMatchObject({ reason: "invalid_response" });
  });
});
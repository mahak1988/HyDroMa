import { describe, it, expect } from "vitest";
import { HttpStacSearchPort } from "../src/adapters/stac-search-port";

describe("HttpStacSearchPort", () => {
  it("returns an empty result set from the stub", async () => {
    const port = new HttpStacSearchPort();
    await expect(port.search({})).resolves.toEqual({ items: [] });
    await expect(port.getCollection("x")).resolves.toBeNull();
  });
});
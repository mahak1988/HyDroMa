import { describe, it, expect } from "vitest";
import { HydroModelAdapter } from "../src/adapters/hydro-model-port";

describe("HydroModelAdapter", () => {
  it("exposes stub provenance and a null run result", async () => {
    const adapter = new HydroModelAdapter();
    await expect(adapter.run({})).resolves.toBeNull();
    expect(adapter.getProvenance()).toMatchObject({ version: "0.0.0", source: "stub" });
  });
});
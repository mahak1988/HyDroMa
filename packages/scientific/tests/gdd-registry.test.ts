import { describe, it, expect } from "vitest";
import { createModelRegistry } from "../src/registry";
import { gddModel } from "../src/gdd-model";

describe("gdd model registry", () => {
  it("registers and executes through the registry", () => {
    const registry = createModelRegistry();
    registry.register(gddModel);
    const entry = registry.get("eco-nojin.gdd", "1.0.0");
    expect(entry).toBeDefined();
    const out = entry!.model.execute!(
      { tMax: 30, tMin: 10, tBase: 10 },
      { runId: "r1", requestedBy: "tester" },
    );
    expect(out.status).toBe("completed");
    expect((out.outputs as { gdd: number }).gdd).toBe(10);
    expect(out.provenance.validationStatus).toBe("tested");
  });
});
import { describe, expect, it } from "vitest";
import { buildTimeline } from "../../../src/sections/agriculture/FarmsModule";

describe("buildTimeline (farm operational timeline)", () => {
  const sources = {
    cycles: [{ id: "c1", farmId: "f1", name: "Cycle A", status: "active", startDate: "2026-03-01" }],
    irrigation: [
      { id: "i1", farmId: "f1", occurredAt: "2026-04-10T08:00", quantity: 12 },
      { id: "i2", farmId: "f2", occurredAt: "2026-04-11T08:00" },
    ],
    observations: [{ id: "o1", farmId: "f1", observedAt: "2026-04-05", name: "Pest note" }],
    projects: [{ id: "p1", farmId: "f1", name: "Terrace project", created_at: "2026-02-01" }],
  };

  it("aggregates only this farm's records, newest first, flagging record-created dates", () => {
    const tl = buildTimeline("f1", sources as any);
    expect(tl.map((e) => e.type).sort()).toEqual(["cropCycle", "irrigation", "observation", "project"]);
    // f2 irrigation excluded.
    expect(tl.some((e) => e.label === "12" || e.to === "/platform/irrigation")).toBe(true);
    expect(tl.length).toBe(4);
    // Descending by date.
    const dates = tl.map((e) => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    // Project has no event date → record-created flag.
    const proj = tl.find((e) => e.type === "project")!;
    expect(proj.recordCreated).toBe(true);
    const irr = tl.find((e) => e.type === "irrigation")!;
    expect(irr.recordCreated).toBe(false);
  });

  it("returns empty for a farm with no records", () => {
    expect(buildTimeline("none", sources as any)).toEqual([]);
  });
});
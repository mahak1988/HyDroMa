import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { OverviewModule } from "../../../src/sections/agriculture/OverviewModule";

function renderOverview() {
  return renderWithProviders(<OverviewModule />);
}

describe("OverviewModule (real-data command centre)", () => {
  it("derives every KPI from the API and shows an honest empty note with no records", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.agri.tasks.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.challenges.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.ecocoin.summary.mockResolvedValue({ balance: 0, totalCredits: 0, totalDebits: 0, entryCount: 0, bySource: {} });
    api.community.activities.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.hydroma.listAssessments.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.models.list.mockResolvedValue({ models: [], source: "test" });
    api.agri.intelligence.mockResolvedValue({ metrics: {}, priorities: [], recent: [] });
    setActiveRole("owner");
    setActiveApi(api);
    renderOverview();

    expect(await screen.findByText(/هیچ دادهٔ عملیاتی ثبت نشده|no operational data/i)).toBeInTheDocument();
    // Real zeros are rendered (not fabricated non-zero numbers).
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(8);
  });

  it("shows real counts and operational priorities", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve({
        items: type === "farms" ? [{ id: "f1", name: "Farm 1" }] : [{ id: "c1", name: "Cycle 1" }],
        nextCursor: null,
        total: 1,
      }),
    );
    api.agri.tasks.mockResolvedValue({ items: [{ id: "t1", status: "assigned" }, { id: "t2", status: "completed" }], nextCursor: null, total: 2 });
    api.challenges.list.mockResolvedValue({ items: [{ id: "ch1", status: "published" }, { id: "ch2", status: "draft" }], nextCursor: null, total: 2 });
    api.ecocoin.summary.mockResolvedValue({ balance: 42, totalCredits: 42, totalDebits: 0, entryCount: 1, bySource: {} });
    api.community.activities.mockResolvedValue({ items: [{ id: "a1" }], nextCursor: null, total: 1 });
    api.hydroma.listAssessments.mockResolvedValue({ items: [{ id: "r1" }], nextCursor: null, total: 1 });
    api.models.list.mockResolvedValue({ models: [{ id: "m1", version: "1.0" }], source: "test" });
    api.agri.intelligence.mockResolvedValue({ metrics: {}, priorities: [{ reason: "irrigation due", severity: "high", label: "Irrigate block A", date: null, to: "/platform/tasks" }], recent: [] });
    setActiveRole("owner");
    setActiveApi(api);
    renderOverview();

    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText("Irrigate block A")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });
});
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { IntelligenceModule } from "../../../src/sections/agriculture/IntelligenceModule";

describe("IntelligenceModule (operations overview)", () => {
  it("renders real metrics and operational (non-scientific) note", async () => {
    const api = makeApi();
    api.agri.intelligence.mockResolvedValue({
      metrics: { farms: 3, openTasks: 5, overdueTasks: 2 },
      priorities: [{ reason: "overdue", severity: "high", label: "Overdue X", date: "2020-01-01", to: "/platform/tasks/t1" }],
      recent: [],
    });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<IntelligenceModule />);

    expect(await screen.findByText("Overdue X")).toBeInTheDocument();
    expect(screen.getByText(/operational indicators, not scientific|عملیاتی‌اند و ارزیابی علمی/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /overview|نمای عملیات/i })).toHaveAttribute("href", "/platform/tasks/t1");
  });
});
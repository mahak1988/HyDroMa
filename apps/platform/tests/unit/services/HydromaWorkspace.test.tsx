import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { HydromaWorkspace } from "../../../src/sections/agriculture/HydromaWorkspace";

const run = {
  id: "run_1",
  organizationId: "org_1",
  runKey: "ui-1",
  modelId: "eco-nojin.hydroma.irrigation-schedule",
  modelVersion: "1.0.0",
  status: "COMPLETED",
  farmId: null,
  cropCycleId: null,
  projectId: null,
  soilProfileId: null,
  soilProfileVersion: null,
  input: { layers: [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }], p: 0.5, depletion_mm: 40 },
  inputHash: "a".repeat(64),
  parameterHash: "b".repeat(64),
  output: { ok: true, result: { net_irrigation_mm: 12.5, gross_irrigation_mm: 15.6, status: "stressed" } },
  resultSummary: "Irrigation model completed.",
  provenance: { model_id: "eco-nojin.hydroma.irrigation-schedule", model_version: "1.0.0", validation_status: "NOT_VALIDATED" },
  units: { net_irrigation_mm: "mm" },
  softwareMaturity: null,
  scientificStatus: "NOT_VALIDATED",
  error: null,
  requestedBy: "u1",
  correlationId: "c1",
  engineRunId: "engine-1",
  reconciliationRequired: false,
  attempts: 1,
  createdAt: "2026-11-26T00:00:00Z",
  updatedAt: "2026-11-26T00:00:01Z",
  startedAt: "2026-11-26T00:00:00Z",
  completedAt: "2026-11-26T00:00:01Z",
};

function renderWorkspace() {
  return renderWithProviders(<HydromaWorkspace />);
}

describe("HydromaWorkspace", () => {
  it("submits real API execution and renders persisted results and history", async () => {
    const api = makeApi();
    api.hydroma.listRuns.mockResolvedValue({ items: [run], nextCursor: null, total: 1 });
    api.hydroma.getRun.mockResolvedValue({ run });
    api.hydroma.createIrrigationRun.mockResolvedValue({ run });
    setActiveRole("owner");
    setActiveApi(api);
    renderWorkspace();

    expect(await screen.findByText("run_1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /اجرای مدل|run model/i }));
    await waitFor(() => expect(api.hydroma.createIrrigationRun).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("12.5")).toBeInTheDocument();
    expect(screen.getAllByText("NOT_VALIDATED").length).toBeGreaterThan(0);
    expect(screen.getByText("engine-1")).toBeInTheDocument();
  });

  it("rejects invalid input before calling the API", async () => {
    const api = makeApi();
    api.hydroma.listRuns.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.hydroma.getRun.mockResolvedValue({ run });
    setActiveRole("owner");
    setActiveApi(api);
    renderWorkspace();

    const p = screen.getByLabelText(/p \(depletion fraction\)/i);
    fireEvent.change(p, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /اجرای مدل|run model/i }));
    await waitFor(() => expect(api.hydroma.createIrrigationRun).not.toHaveBeenCalled());
  });
});
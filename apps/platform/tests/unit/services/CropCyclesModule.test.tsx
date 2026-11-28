import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { CropCyclesModule } from "../../../src/sections/agriculture/CropCyclesModule";

describe("CropCyclesModule (M05 crop-cycle workflow)", () => {
  it("creates a crop cycle through the API with agronomic fields and no status", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "farms"
          ? { items: [{ id: "f1", name: "North Field" }], nextCursor: null, total: 1 }
          : { items: [], nextCursor: null, total: 0 },
      ),
    );
    api.resources.create.mockResolvedValue({ id: "c1", crop: "Wheat", status: "planned", yieldAttainmentPct: null });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<CropCyclesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن چرخهٔ محصول|add crop cycle/i }));
    const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
    fireEvent.change(byId("crop-name"), { target: { value: "Wheat" } });
    fireEvent.change(byId("crop-farm"), { target: { value: "f1" } });
    fireEvent.change(byId("crop-area"), { target: { value: "5" } });
    fireEvent.change(byId("crop-season-start"), { target: { value: "2026-03-01" } });
    fireEvent.change(byId("crop-season-end"), { target: { value: "2026-06-01" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith(
        "cropCycles",
        expect.objectContaining({ crop: "Wheat", areaHa: 5, seasonStart: "2026-03-01", seasonEnd: "2026-06-01" }),
      ),
    );
    const call = api.resources.create.mock.calls[0];
    expect(call).toBeTruthy();
    expect(call![1] as Record<string, unknown>).not.toHaveProperty("status");
  });

  it("offers the next lifecycle stage and records a harvest with actual yield", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "farms"
          ? { items: [{ id: "f1", name: "North Field" }], nextCursor: null, total: 1 }
          : { items: [{ id: "c1", type: "cropCycles", crop: "Wheat", farmId: "f1", areaHa: 5, status: "growing", seasonStart: "2026-03-01", seasonEnd: "2026-06-01", yieldAttainmentPct: null }], nextCursor: null, total: 1 },
      ),
    );
    api.resources.transition.mockResolvedValue({ id: "c1", type: "cropCycles", status: "harvested", yieldAttainmentPct: 80 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<CropCyclesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /ثبت برداشت|record harvest/i }));
    fireEvent.change(screen.getByLabelText(/عملکرد واقعی|actual yield/i), { target: { value: "800" } });
    fireEvent.click(screen.getByRole("button", { name: /تأیید|confirm/i }));

    await waitFor(() => expect(api.resources.transition).toHaveBeenCalledWith("cropCycles", "c1", "harvested", { actualYield: 800 }));
  });

  it("hides write actions for a viewer", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<CropCyclesModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن چرخهٔ محصول|add crop cycle/i })).not.toBeInTheDocument();
  });
});
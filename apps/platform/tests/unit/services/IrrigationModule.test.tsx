import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { IrrigationModule } from "../../../src/sections/agriculture/IrrigationModule";

describe("IrrigationModule (irrigation observation workflow)", () => {
  it("creates an irrigation observation with farm, quantity, unit and datetime; no modeled fields", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "farms"
          ? { items: [{ id: "f1", name: "River Plot" }], nextCursor: null, total: 1 }
          : { items: [], nextCursor: null, total: 0 },
      ),
    );
    api.resources.create.mockResolvedValue({ id: "e1", quantity: 12.5, unit: "mm", method: "drip" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<IrrigationModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن رویداد|add event/i }));
    const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
    fireEvent.change(byId("irr-farm"), { target: { value: "f1" } });
    fireEvent.change(byId("irr-quantity"), { target: { value: "12.5" } });
    fireEvent.change(byId("irr-occurred"), { target: { value: "2026-05-01T08:00" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith(
        "irrigationEvents",
        expect.objectContaining({ farmId: "f1", quantity: 12.5, unit: "mm", method: "drip", occurredAt: "2026-05-01T08:00" }),
      ),
    );
    const payload = api.resources.create.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("et0");
    expect(payload).not.toHaveProperty("status");
  });

  it("blocks an empty quantity without calling the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<IrrigationModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن رویداد|add event/i }));
    const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
    fireEvent.change(byId("irr-farm"), { target: { value: "f1" } });
    fireEvent.change(byId("irr-occurred"), { target: { value: "2026-05-01T08:00" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/مقدار باید|positive number/i)).toBeInTheDocument();
    expect(api.resources.create).not.toHaveBeenCalled();
  });

  it("hides write actions for a viewer", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<IrrigationModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن رویداد|add event/i })).not.toBeInTheDocument();
  });
});
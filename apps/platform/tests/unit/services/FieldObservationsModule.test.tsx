import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { FieldObservationsModule } from "../../../src/sections/agriculture/FieldObservationsModule";

describe("FieldObservationsModule (field observation workflow)", () => {
  it("creates a field observation with farm, category, observer and datetime; no diagnosis fields", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "farms"
          ? { items: [{ id: "f1", name: "Meadow" }], nextCursor: null, total: 1 }
          : { items: [], nextCursor: null, total: 0 },
      ),
    );
    api.resources.create.mockResolvedValue({ id: "o1", category: "crop_health", severity: "moderate" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<FieldObservationsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن مشاهده|add observation/i }));
    const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
    fireEvent.change(byId("obs-farm"), { target: { value: "f1" } });
    fireEvent.change(byId("obs-observer"), { target: { value: "Sara" } });
    fireEvent.change(byId("obs-observed"), { target: { value: "2026-05-01T09:00" } });
    fireEvent.change(byId("obs-description"), { target: { value: "Lower leaves yellowing" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith(
        "fieldObservations",
        expect.objectContaining({ farmId: "f1", category: "crop_health", observer: "Sara", observedAt: "2026-05-01T09:00", description: "Lower leaves yellowing" }),
      ),
    );
    const payload = api.resources.create.mock.calls[0]![1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("diagnosis");
    expect(payload).not.toHaveProperty("recommendation");
  });

  it("blocks an empty description without calling the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<FieldObservationsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن مشاهده|add observation/i }));
    const byId = (id: string) => document.getElementById(id) as HTMLInputElement;
    fireEvent.change(byId("obs-farm"), { target: { value: "f1" } });
    fireEvent.change(byId("obs-observer"), { target: { value: "Sara" } });
    fireEvent.change(byId("obs-observed"), { target: { value: "2026-05-01T09:00" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/شرح باید|at least 2/i)).toBeInTheDocument();
    expect(api.resources.create).not.toHaveBeenCalled();
  });

  it("hides write actions for a viewer", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<FieldObservationsModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن مشاهده|add observation/i })).not.toBeInTheDocument();
  });
});
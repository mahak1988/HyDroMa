import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { FarmsModule } from "../../../src/sections/agriculture/FarmsModule";

describe("FarmsModule (M05 vertical slice)", () => {
  it("lists real rows from the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [{ id: "f1", type: "farms", name: "Kondor Farm", areaHa: 12.5 }], nextCursor: null, total: 1 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<FarmsModule />);
    expect(await screen.findByText("Kondor Farm")).toBeInTheDocument();
  });

  it("creates a farm through the API and shows a success toast", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.resources.create.mockResolvedValue({ id: "f2", name: "New Farm" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<FarmsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن|add farm/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "New Farm" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith("farms", expect.objectContaining({ organizationId: "org-test", name: "New Farm" })),
    );
    expect(await screen.findByText(/افزوده شد|added/i)).toBeInTheDocument();
  });

  it("blocks invalid input and never calls the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<FarmsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن|add farm/i }));
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/حداقل ۲ حرف|at least 2/i)).toBeInTheDocument();
    expect(api.resources.create).not.toHaveBeenCalled();
  });

  it("hides write actions for a viewer (permission-aware)", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<FarmsModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن|add farm/i })).not.toBeInTheDocument();
  });
});
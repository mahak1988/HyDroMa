import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { TerritoriesModule } from "../../../src/sections/territory/TerritoriesModule";

describe("TerritoriesModule (M01 vertical slice)", () => {
  it("lists real rows from the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [{ id: "l1", type: "landscapes", name: "Kondor Landscape", region: "Alborz", country: "IR" }], nextCursor: null, total: 1 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<TerritoriesModule />);
    expect(await screen.findByText("Kondor Landscape")).toBeInTheDocument();
  });

  it("creates a territory through the API and shows a success toast", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.resources.create.mockResolvedValue({ id: "l2", name: "New Territory" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<TerritoriesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن قلمرو|add territory/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "New Territory" } });
    fireEvent.change(screen.getByLabelText(/منطقه|region/i), { target: { value: "Alborz" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith("landscapes", expect.objectContaining({ organizationId: "org-test", name: "New Territory", region: "Alborz" })),
    );
    expect(await screen.findByText(/افزوده شد|added/i)).toBeInTheDocument();
  });

  it("blocks invalid input and never calls the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<TerritoriesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن قلمرو|add territory/i }));
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/حداقل ۲ حرف|at least 2/i)).toBeInTheDocument();
    expect(api.resources.create).not.toHaveBeenCalled();
  });

  it("hides write actions for a viewer and discloses no-geometry limitation", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<TerritoriesModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن قلمرو|add territory/i })).not.toBeInTheDocument();
    expect(screen.getByText(/هندسهٔ جغرافیایی|geometry and GIS/i)).toBeInTheDocument();
  });
});
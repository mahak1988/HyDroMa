import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { VillagesModule } from "../../../src/sections/communities/VillagesModule";

describe("VillagesModule (M02 vertical slice)", () => {
  it("lists real rows from the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [{ id: "v1", type: "villages", name: "Deh Nokhod", region: "Alborz" }], nextCursor: null, total: 1 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<VillagesModule />);
    expect(await screen.findByText("Deh Nokhod")).toBeInTheDocument();
  });

  it("creates a village through the API and shows a success toast", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.resources.create.mockResolvedValue({ id: "v2", name: "New Village" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<VillagesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن روستا|add village/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "New Village" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith("villages", expect.objectContaining({ organizationId: "org-test", name: "New Village" })),
    );
    expect(await screen.findByText(/افزوده شد|added/i)).toBeInTheDocument();
  });

  it("blocks invalid input and never calls the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<VillagesModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن روستا|add village/i }));
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/حداقل ۲ حرف|at least 2/i)).toBeInTheDocument();
    expect(api.resources.create).not.toHaveBeenCalled();
  });

  it("hides write actions for a viewer and shows the data-minimization note", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<VillagesModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن روستا|add village/i })).not.toBeInTheDocument();
    expect(screen.getByText(/دادهٔ جمعیتی یا شخصی|demographic or personal/i)).toBeInTheDocument();
  });
});
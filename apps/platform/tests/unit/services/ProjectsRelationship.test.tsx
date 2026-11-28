import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { ProjectsModule } from "../../../src/sections/projects/ProjectsModule";

describe("Territory → Project relationship (persisted)", () => {
  it("persists territoryId on create through the API", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "landscapes"
          ? { items: [{ id: "t1", type: "landscapes", name: "Alborz Territory" }], nextCursor: null, total: 1 }
          : { items: [], nextCursor: null, total: 0 },
      ),
    );
    api.resources.create.mockResolvedValue({ id: "p1", name: "Linked Project", territoryId: "t1" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن پروژه|add project/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "Linked Project" } });
    fireEvent.change(screen.getByLabelText(/قلمرو|territory/i), { target: { value: "t1" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith("projects", expect.objectContaining({ name: "Linked Project", territoryId: "t1" })),
    );
  });

  it("resolves and links the related territory name in the list", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "landscapes"
          ? { items: [{ id: "t1", type: "landscapes", name: "Alborz Territory" }], nextCursor: null, total: 1 }
          : { items: [{ id: "p1", type: "projects", name: "Linked Project", territoryId: "t1" }], nextCursor: null, total: 1 },
      ),
    );
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    const link = await screen.findByRole("link", { name: "Alborz Territory" });
    expect(link).toHaveAttribute("href", "/platform/territories");
  });
});
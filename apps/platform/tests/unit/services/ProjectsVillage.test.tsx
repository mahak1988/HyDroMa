import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { ProjectsModule } from "../../../src/sections/projects/ProjectsModule";

function listMock(projects: unknown[], villages: unknown[], landscapes: unknown[] = [], farms: unknown[] = []) {
  return (type: string) =>
    Promise.resolve(
      type === "villages"
        ? { items: villages, nextCursor: null, total: villages.length }
        : type === "landscapes"
          ? { items: landscapes, nextCursor: null, total: landscapes.length }
          : type === "farms"
            ? { items: farms, nextCursor: null, total: farms.length }
            : { items: projects, nextCursor: null, total: projects.length },
    );
}

describe("Village → Project relationship (persisted)", () => {
  it("persists villageId on create", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([], [{ id: "v1", type: "villages", name: "Deh Nokhod" }]));
    api.resources.create.mockResolvedValue({ id: "p1", name: "P", villageId: "v1" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن پروژه|add project/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "Proj" } });
    fireEvent.change(screen.getByLabelText(/روستا|village/i), { target: { value: "v1" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() => expect(api.resources.create).toHaveBeenCalledWith("projects", expect.objectContaining({ villageId: "v1" })));
  });

  it("shows no village when association is missing (backward compatible)", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([{ id: "p1", type: "projects", name: "No Village Project" }], []));
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByText("No Village Project")).toBeInTheDocument();
    expect(screen.getAllByText(/بدون روستا|no village/i).length).toBeGreaterThan(0);
  });

  it("resolves and links the associated village name", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([{ id: "p1", type: "projects", name: "Linked", villageId: "v1" }], [{ id: "v1", type: "villages", name: "Deh Nokhod" }]));
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByRole("link", { name: "Deh Nokhod" })).toHaveAttribute("href", "/platform/communities");
  });

  it("renders a dangling village reference safely (raw id, no crash)", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([{ id: "p1", type: "projects", name: "Dangling", villageId: "missing-v" }], []));
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByRole("link", { name: "missing-v" })).toHaveAttribute("href", "/platform/communities");
  });

  it("preserves Territory → Project (territory link still renders)", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(
      listMock([{ id: "p1", type: "projects", name: "Both", territoryId: "t1", villageId: "v1" }], [{ id: "v1", type: "villages", name: "Deh Nokhod" }], [{ id: "t1", type: "landscapes", name: "Alborz" }]),
    );
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByRole("link", { name: "Alborz" })).toHaveAttribute("href", "/platform/territories");
    expect(screen.getByRole("link", { name: "Deh Nokhod" })).toHaveAttribute("href", "/platform/communities");
  });
});
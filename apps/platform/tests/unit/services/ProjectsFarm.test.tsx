import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { ProjectsModule } from "../../../src/sections/projects/ProjectsModule";

function listMock(projects: unknown[], farms: unknown[], villages: unknown[] = [], landscapes: unknown[] = []) {
  return (type: string) =>
    Promise.resolve(
      type === "farms"
        ? { items: farms, nextCursor: null, total: farms.length }
        : type === "villages"
          ? { items: villages, nextCursor: null, total: villages.length }
          : type === "landscapes"
            ? { items: landscapes, nextCursor: null, total: landscapes.length }
            : { items: projects, nextCursor: null, total: projects.length },
    );
}

describe("Farm → Project relationship (persisted)", () => {
  it("persists farmId on create", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([], [{ id: "f1", type: "farms", name: "Kondor Farm" }]));
    api.resources.create.mockResolvedValue({ id: "p1", name: "Proj", farmId: "f1" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن پروژه|add project/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "Proj" } });
    fireEvent.change(screen.getByLabelText(/مزرعه|farm/i), { target: { value: "f1" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() => expect(api.resources.create).toHaveBeenCalledWith("projects", expect.objectContaining({ farmId: "f1" })));
  });

  it("shows no farm when association is missing (backward compatible)", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([{ id: "p1", type: "projects", name: "No Farm Project" }], []));
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByText("No Farm Project")).toBeInTheDocument();
    expect(screen.getAllByText(/بدون مزرعه|no farm/i).length).toBeGreaterThan(0);
  });

  it("resolves and links the associated farm name to agriculture", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([{ id: "p1", type: "projects", name: "Linked", farmId: "f1" }], [{ id: "f1", type: "farms", name: "Kondor Farm" }]));
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByRole("link", { name: "Kondor Farm" })).toHaveAttribute("href", "/platform/agriculture");
  });

  it("renders a dangling farm reference safely (raw id)", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(listMock([{ id: "p1", type: "projects", name: "Dangling", farmId: "missing-f" }], []));
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByRole("link", { name: "missing-f" })).toHaveAttribute("href", "/platform/agriculture");
  });

  it("preserves Territory and Village links alongside Farm", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation(
      listMock(
        [{ id: "p1", type: "projects", name: "All", territoryId: "t1", villageId: "v1", farmId: "f1" }],
        [{ id: "f1", type: "farms", name: "Kondor Farm" }],
        [{ id: "v1", type: "villages", name: "Deh Nokhod" }],
        [{ id: "t1", type: "landscapes", name: "Alborz" }],
      ),
    );
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByRole("link", { name: "Alborz" })).toHaveAttribute("href", "/platform/territories");
    expect(screen.getByRole("link", { name: "Deh Nokhod" })).toHaveAttribute("href", "/platform/communities");
    expect(screen.getByRole("link", { name: "Kondor Farm" })).toHaveAttribute("href", "/platform/agriculture");
  });
});
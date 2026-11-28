import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { ProjectDetail } from "../../../src/sections/projects/ProjectsModule";

describe("ProjectDetail (deep-linkable)", () => {
  it("resolves and links related territory, village and farm", async () => {
    const api = makeApi();
    api.resources.get.mockResolvedValue({ id: "p1", type: "projects", name: "Restoration Project", status: "active", territoryId: "t1", villageId: "v1", farmId: "f1", description: "Rehabilitate rangeland" });
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "landscapes"
          ? { items: [{ id: "t1", name: "Alborz" }], nextCursor: null, total: 1 }
          : type === "villages"
            ? { items: [{ id: "v1", name: "Deh Nokhod" }], nextCursor: null, total: 1 }
            : { items: [{ id: "f1", name: "Kondor Farm" }], nextCursor: null, total: 1 },
      ),
    );
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(
      <Routes>
        <Route path="/platform/projects/:id" element={<ProjectDetail />} />
      </Routes>,
      "/platform/projects/p1",
    );

    expect(await screen.findByRole("heading", { name: "Restoration Project" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alborz" })).toHaveAttribute("href", "/platform/territories");
    expect(screen.getByRole("link", { name: "Deh Nokhod" })).toHaveAttribute("href", "/platform/communities");
    expect(screen.getByRole("link", { name: "Kondor Farm" })).toHaveAttribute("href", "/platform/agriculture");
    expect(api.resources.get).toHaveBeenCalledWith("projects", "p1", expect.anything());
  });
});
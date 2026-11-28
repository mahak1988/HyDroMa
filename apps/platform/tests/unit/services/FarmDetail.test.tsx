import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { FarmDetail } from "../../../src/sections/agriculture/FarmsModule";

function listMock(projects: unknown[]) {
  return (type: string) =>
    Promise.resolve(
      type === "projects"
        ? { items: projects, nextCursor: null, total: projects.length }
        : { items: [], nextCursor: null, total: 0 },
    );
}

describe("FarmDetail (agricultural hub)", () => {
  it("shows farm summary and the projects linked to it", async () => {
    const api = makeApi();
    api.resources.get.mockResolvedValue({ id: "f1", type: "farms", name: "Kondor Farm", areaHa: 12.5, notes: "terraced" });
    api.resources.list.mockImplementation(listMock([
      { id: "p1", type: "projects", name: "Terrace Rehabilitation", farmId: "f1" },
      { id: "p2", type: "projects", name: "Other Project", farmId: "f2" },
    ]));
    api.agri.timeline.mockResolvedValue({ items: [{ date: "", type: "project", label: "Terrace Rehabilitation", to: "/platform/projects/p1", recordCreated: true }], total: 1, nextCursor: null });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(
      <Routes><Route path="/platform/agriculture/:id" element={<FarmDetail />} /></Routes>,
      "/platform/agriculture/f1",
    );

    expect(await screen.findByRole("heading", { name: "Kondor Farm" })).toBeInTheDocument();
    // The linked project is shown (Related projects card + timeline) and navigable.
    expect((await screen.findAllByText("Terrace Rehabilitation")).length).toBeGreaterThan(0);
    expect(document.querySelector('a[href="/platform/projects/p1"]')).not.toBeNull();
    expect(screen.queryByText("Other Project")).not.toBeInTheDocument();
    expect(api.resources.get).toHaveBeenCalledWith("farms", "f1", expect.anything());
  });

  it("shows an empty timeline message when no records are linked", async () => {
    const api = makeApi();
    api.resources.get.mockResolvedValue({ id: "f1", type: "farms", name: "Lonely Farm" });
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.agri.timeline.mockResolvedValue({ items: [], total: 0, nextCursor: null });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(
      <Routes><Route path="/platform/agriculture/:id" element={<FarmDetail />} /></Routes>,
      "/platform/agriculture/f1",
    );

    expect(await screen.findByText(/No operational events|رویدادی برای این مزرعه/)).toBeInTheDocument();
  });
});
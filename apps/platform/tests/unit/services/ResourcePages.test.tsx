import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ApiError } from "@eco-nojin/api-client";
import { Route, Routes } from "react-router-dom";
import { makeApi, renderWithProviders, setActiveApi } from "./harness";
import { ResourceDetailPage, ResourceListPage } from "../../../src/sections/api-pages/ResourcePages";

describe("ResourceListPage (API-backed)", () => {
  it("maps a real response into table rows", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({
      items: [
        { id: "l1", type: "landscapes", name: "Kondor", region: "Alborz" },
        { id: "l2", type: "landscapes", name: "Taleghan" },
      ],
      nextCursor: null,
      total: 2,
    });
    setActiveApi(api);
    renderWithProviders(<ResourceListPage type="landscapes" />);

    expect(await screen.findByText("Kondor")).toBeInTheDocument();
    expect(screen.getByText("Taleghan")).toBeInTheDocument();
    expect(api.resources.list).toHaveBeenCalledWith("landscapes", expect.anything(), expect.anything());
  });

  it("shows an honest empty state when the API returns no rows", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveApi(api);
    renderWithProviders(<ResourceListPage type="farms" />);

    expect(await screen.findByText(/No data recorded|هنوز داده/)).toBeInTheDocument();
  });

  it("shows an error state with retry when the request fails", async () => {
    const api = makeApi();
    api.resources.list.mockRejectedValue(new ApiError({ code: "network", status: 0, messageKey: "errors.network" }));
    setActiveApi(api);
    renderWithProviders(<ResourceListPage type="villages" />);

    expect(await screen.findByText(/did not respond|پاسخ نداد/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again|تلاش مجدد/i })).toBeInTheDocument();
  });
});

describe("ResourceDetailPage (API-backed)", () => {
  it("maps a single record into a definition list", async () => {
    const api = makeApi();
    api.resources.get.mockResolvedValue({ id: "p1", type: "projects", name: "Rangeland recovery", status: "active" });
    setActiveApi(api);
    renderWithProviders(
      <Routes>
        <Route path="/platform/projects/:id" element={<ResourceDetailPage type="projects" />} />
      </Routes>,
      "/platform/projects/p1",
    );

    expect((await screen.findAllByText("Rangeland recovery")).length).toBeGreaterThan(0);
    expect(api.resources.get).toHaveBeenCalledWith("projects", "p1", expect.anything());
  });
});
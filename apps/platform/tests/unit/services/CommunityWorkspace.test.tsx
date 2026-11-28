import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { CommunityWorkspace } from "../../../src/sections/communities/CommunityWorkspace";

describe("CommunityWorkspace (activities)", () => {
  it("creates an activity through the API", async () => {
    const api = makeApi();
    api.resources.get.mockResolvedValue({ id: "c1", type: "villages", name: "Deh A" });
    api.community.activities.mockResolvedValue({ items: [], total: 0, nextCursor: null });
    api.community.createActivity.mockResolvedValue({ id: "a1", title: "Cleanup" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<Routes><Route path="/platform/communities/:id" element={<CommunityWorkspace />} /></Routes>, "/platform/communities/c1");

    fireEvent.click(await screen.findByRole("button", { name: /افزودن فعالیت|add activity/i }));
    fireEvent.change(screen.getByLabelText(/عنوان|title/i), { target: { value: "Cleanup" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() => expect(api.community.createActivity).toHaveBeenCalledWith(expect.objectContaining({ communityId: "c1", title: "Cleanup", category: "community" })));
  });
});
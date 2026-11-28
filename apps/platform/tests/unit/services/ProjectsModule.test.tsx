import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { ProjectsModule } from "../../../src/sections/projects/ProjectsModule";

describe("ProjectsModule (M13 vertical slice)", () => {
  it("lists real rows from the API", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "landscapes" || type === "villages" || type === "farms"
          ? { items: [], nextCursor: null, total: 0 }
          : { items: [{ id: "p1", type: "projects", name: "Rangeland Recovery", status: "active" }], nextCursor: null, total: 1 },
      ),
    );
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);
    expect(await screen.findByText("Rangeland Recovery")).toBeInTheDocument();
  });

  it("creates a project through the API and shows a success toast", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.resources.create.mockResolvedValue({ id: "p2", name: "New Project", status: "planned" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن پروژه|add project/i }));
    fireEvent.change(screen.getByLabelText(/نام|name/i), { target: { value: "New Project" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    // Status is workflow-owned: the create payload must NOT carry a status field.
    await waitFor(() =>
      expect(api.resources.create).toHaveBeenCalledWith("projects", expect.objectContaining({ organizationId: "org-test", name: "New Project" })),
    );
    const call = api.resources.create.mock.calls[0];
    expect(call).toBeTruthy();
    const payload = call![1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("status");
    expect(await screen.findByText(/افزوده شد|added/i)).toBeInTheDocument();
  });

  it("offers a legal status transition and calls the transition endpoint", async () => {
    const api = makeApi();
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(
        type === "landscapes" || type === "villages" || type === "farms"
          ? { items: [], nextCursor: null, total: 0 }
          : { items: [{ id: "p1", type: "projects", name: "Active Project", status: "active" }], nextCursor: null, total: 1 },
      ),
    );
    api.resources.transition.mockResolvedValue({ id: "p1", type: "projects", status: "completed" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /change status.*completed|تغییر وضعیت.*completed/i }));
    await waitFor(() => expect(api.resources.transition).toHaveBeenCalledWith("projects", "p1", "completed", {}));
  });

  it("blocks invalid input and never calls the API", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن پروژه|add project/i }));
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/حداقل ۲ حرف|at least 2/i)).toBeInTheDocument();
    expect(api.resources.create).not.toHaveBeenCalled();
  });

  it("hides write actions for a viewer (permission-aware)", async () => {
    const api = makeApi();
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("viewer");
    setActiveApi(api);
    renderWithProviders(<ProjectsModule />);

    expect(await screen.findByText(/نقش write|write role/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /افزودن پروژه|add project/i })).not.toBeInTheDocument();
  });
});
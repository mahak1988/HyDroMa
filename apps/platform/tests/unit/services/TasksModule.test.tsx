import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi, setActiveRole } from "./harness";
import { TasksModule } from "../../../src/sections/agriculture/TasksModule";

describe("TasksModule (agricultural tasks)", () => {
  it("creates a task through the API", async () => {
    const api = makeApi();
    api.agri.tasks.mockResolvedValue({ items: [], total: 0, nextCursor: null });
    api.resources.list.mockImplementation((type: string) =>
      Promise.resolve(type === "farms" ? { items: [{ id: "f1", name: "Farm A" }], nextCursor: null, total: 1 } : { items: [], nextCursor: null, total: 0 }),
    );
    api.agri.createTask.mockResolvedValue({ id: "t1", title: "Plant" });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<TasksModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن کار|add task/i }));
    fireEvent.change(document.getElementById("t-farm")!, { target: { value: "f1" } });
    fireEvent.change(screen.getByLabelText(/عنوان|title/i), { target: { value: "Plant" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    await waitFor(() => expect(api.agri.createTask).toHaveBeenCalledWith(expect.objectContaining({ farmId: "f1", title: "Plant", category: "general" })));
  });

  it("blocks a task without a farm", async () => {
    const api = makeApi();
    api.agri.tasks.mockResolvedValue({ items: [], total: 0, nextCursor: null });
    api.resources.list.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveRole("owner");
    setActiveApi(api);
    renderWithProviders(<TasksModule />);

    fireEvent.click(await screen.findByRole("button", { name: /افزودن کار|add task/i }));
    fireEvent.change(screen.getByLabelText(/عنوان|title/i), { target: { value: "No Farm" } });
    fireEvent.click(screen.getByRole("button", { name: /ذخیره|save/i }));

    expect(await screen.findByText(/انتخاب مزرعه|a farm is required/i)).toBeInTheDocument();
    expect(api.agri.createTask).not.toHaveBeenCalled();
  });
});
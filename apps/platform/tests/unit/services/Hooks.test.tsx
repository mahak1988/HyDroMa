import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { makeApi, setActiveApi } from "./harness";
import { useCreateProduct, useDeleteResource, useUpdateResource } from "../../../src/services/hooks";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("mutation hooks (real client methods)", () => {
  it("useUpdateResource calls resources.update and invalidates", async () => {
    const api = makeApi();
    api.resources.update.mockResolvedValue({ id: "f1", name: "x" });
    setActiveApi(api);
    const { result } = renderHook(() => useUpdateResource("farms"), { wrapper });
    result.current.mutate({ id: "f1", patch: { name: "x" } });
    await waitFor(() => expect(api.resources.update).toHaveBeenCalledWith("farms", "f1", { name: "x" }));
  });

  it("useDeleteResource calls resources.remove", async () => {
    const api = makeApi();
    api.resources.remove.mockResolvedValue({ ok: true });
    setActiveApi(api);
    const { result } = renderHook(() => useDeleteResource("farms"), { wrapper });
    result.current.mutate("f1");
    await waitFor(() => expect(api.resources.remove).toHaveBeenCalledWith("farms", "f1"));
  });

  it("useCreateProduct calls catalog.createProduct", async () => {
    const api = makeApi();
    api.catalog.createProduct.mockResolvedValue({ id: "prd1" });
    setActiveApi(api);
    const { result } = renderHook(() => useCreateProduct(), { wrapper });
    result.current.mutate({ name: "Saffron", priceMinor: 1850 });
    await waitFor(() => expect(api.catalog.createProduct).toHaveBeenCalledWith({ name: "Saffron", priceMinor: 1850 }));
  });
});
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { makeApi, renderWithProviders, setActiveApi } from "./harness";
import { MarketplacePage } from "../../../src/sections/api-pages/MarketplacePage";
import { NotificationsPage } from "../../../src/sections/api-pages/NotificationsPage";
import { ModelsPage } from "../../../src/sections/api-pages/ModelsPage";

describe("MarketplacePage (API-backed catalog)", () => {
  it("renders real products, sellers and categories", async () => {
    const api = makeApi();
    api.catalog.products.mockResolvedValue({
      items: [
        { id: "prd1", slug: "saffron", sellerId: "sel1", categoryId: "cat1", name: "Saffron", price: { amountMinor: 1850, currency: "EUR" }, unit: "kg", stock: 12 },
      ],
      nextCursor: null,
      total: 1,
    });
    api.catalog.sellers.mockResolvedValue({ items: [{ id: "sel1", slug: "kondor", name: "Kondor Coop", kind: "coop", country: "IR", region: null, verification: "verified", summary: null }], nextCursor: null, total: 1 });
    api.catalog.categories.mockResolvedValue({ items: [{ id: "cat1", parentId: null, labelKey: "spices" }], nextCursor: null, total: 1 });
    setActiveApi(api);
    renderWithProviders(<MarketplacePage />);

    expect(await screen.findByText("Saffron")).toBeInTheDocument();
    expect((await screen.findAllByText("Kondor Coop")).length).toBeGreaterThan(0);
    expect(screen.getByText(/18\.50/)).toBeInTheDocument();
  });

  it("is honest when the catalog is empty", async () => {
    const api = makeApi();
    api.catalog.products.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.catalog.sellers.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    api.catalog.categories.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
    setActiveApi(api);
    renderWithProviders(<MarketplacePage />);

    expect(await screen.findByText(/No data recorded|هنوز داده/)).toBeInTheDocument();
  });
});

describe("NotificationsPage (API-backed)", () => {
  it("renders audit-derived notifications and disables mark-read when none unread", async () => {
    const api = makeApi();
    api.notifications.list.mockResolvedValue({ items: [{ id: 1, organizationId: "o", actorId: "a", action: "project.create", entity: "project", entityId: "p1", at: "2026-11-20", unread: false }], unread: 0 });
    api.notifications.markSeen.mockResolvedValue({ ok: true, unread: 0 });
    setActiveApi(api);
    renderWithProviders(<NotificationsPage />);

    expect(await screen.findByText("project.create")).toBeInTheDocument();
    const markBtn = screen.getByRole("button", { name: /mark all as read|علامت‌گذاری/i });
    expect(markBtn).toBeDisabled();
  });
});

describe("ModelsPage (API-backed registry)", () => {
  it("renders the model registry without fabricating results", async () => {
    const api = makeApi();
    api.models.list.mockResolvedValue({ models: [{ id: "eco-nojin.hydroma.water-balance", version: "1.1.0", title: "Root-zone water balance", domain: "water", scientific_status: "not_validated" }], source: "eco-nojin-api" });
    setActiveApi(api);
    renderWithProviders(<ModelsPage />);

    expect(await screen.findByText("Root-zone water balance")).toBeInTheDocument();
    expect(screen.getByText("not_validated")).toBeInTheDocument();
  });
});
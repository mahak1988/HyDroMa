import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, matchRoutes } from "react-router-dom";
import { I18nProvider, en } from "@eco-nojin/i18n";
import { describe, expect, it, vi } from "vitest";
import { appRoutes } from "../../../src/app/router";
import { DemoLayout } from "../../../src/app/DemoLayout";
import { demoHref } from "../../../src/app/PlatformLayout";
import { MarketDemoNotice } from "../../../src/sections/market/app/MarketLayout";
import { PageRenderer } from "../../../src/pages/PageRenderer";
import { PAGES } from "../../../src/content/pages";

function matches(path: string) {
  return matchRoutes(appRoutes, path) ?? [];
}

function inDemoBoundary(path: string) {
  return matches(path).some((match) => match.route.element?.type === DemoLayout);
}

describe("demo boundary behavior", () => {
  it("resolves a reachable demo route inside the boundary", () => {
    const found = matches("/platform/agriculture/planning");
    expect(found.some((match) => match.route.path === "agriculture/planning")).toBe(true);
    expect(inDemoBoundary("/platform/agriculture/planning")).toBe(true);
  });

  it("keeps real dynamic capability routes outside the demo boundary", () => {
    const found = matches("/platform/agriculture/abc");
    expect(found.some((match) => match.route.path === "agriculture/:id")).toBe(true);
    expect(inDemoBoundary("/platform/agriculture/abc")).toBe(false);
  });

  it("renders a persistent DEMO note for direct URL access", () => {
    render(
      <I18nProvider initialLocale="en">
        <MemoryRouter initialEntries={["/platform/agriculture/planning"]}>
          <Routes>
            <Route element={<DemoLayout />}>
              <Route path="/platform/agriculture/planning" element={<div>demo content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
    const note = screen.getByRole("note");
    expect(note.textContent).toContain("Demo environment");
    expect(note.textContent).toContain("local demo data only");
    expect(screen.getByText("demo content")).toBeTruthy();
  });

  it("does not offer the demo link in sections without a demo route", () => {
    expect(demoHref("/landscape")).toBeNull();
    expect(demoHref("/platform")).toBe("/platform/demo");
  });

  it("does not call the network when a demo create is submitted", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const page = PAGES.find((candidate) => candidate.kind === "list" && candidate.entity === "village");
    if (!page) throw new Error("village list page missing");
    const user = userEvent.setup();
    render(
      <I18nProvider initialLocale="en">
        <MemoryRouter>
          <PageRenderer page={page} />
        </MemoryRouter>
      </I18nProvider>,
    );
    await user.click(screen.getByRole("button", { name: /^Create village/u }));
    await user.type(screen.getByLabelText(/^Name/u), "Demo village");
    const buttons = screen.getAllByRole("button", { name: /^Create$/u });
    await user.click(buttons[buttons.length - 1]!);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Saved (demo)")).toBeTruthy();
    fetchSpy.mockRestore();
  });
});

describe("marketplace boundary behavior", () => {
  it("resolves the authoritative marketplace route", () => {
    const found = matches("/platform/marketplace");
    expect(found.some((match) => match.route.path === "marketplace")).toBe(true);
    expect(inDemoBoundary("/platform/marketplace")).toBe(false);
  });

  it("renders the demo notice with a link to the authoritative catalog", () => {
    render(
      <I18nProvider initialLocale="en">
        <MemoryRouter>
          <MarketDemoNotice />
        </MemoryRouter>
      </I18nProvider>,
    );
    const link = screen.getByRole("link", { name: "Open the live catalog" });
    expect(link.getAttribute("href")).toBe("/platform/marketplace");
    expect(screen.getByRole("note").textContent).toContain("Demonstration marketplace");
  });

  it("keeps checkout wording free of payment claims", () => {
    expect(en.market.orderPlaced.toLowerCase()).toContain("no payment");
    expect(en.market.placeOrder.toLowerCase()).toContain("demo");
  });
});

describe("HyDroMA route behavior", () => {
  it("resolves the canonical run route outside the demo boundary", () => {
    const found = matches("/platform/hydroma/run");
    expect(found.some((match) => match.route.path === "hydroma/run")).toBe(true);
    expect(inDemoBoundary("/platform/hydroma/run")).toBe(false);
  });
});

describe("entity field translations render", () => {
  const page = PAGES.find((candidate) => candidate.kind === "list" && candidate.entity === "village");
  if (!page) throw new Error("village list page is missing");

  const cases = [
    { locale: "fa", button: /ایجاد/u, label: "نام" },
    { locale: "en", button: /Create/u, label: "Name" },
    { locale: "ar", button: /إنشاء/u, label: "الاسم" },
  ] as const;

  for (const item of cases) {
    it(`renders localized entity fields in ${item.locale}`, async () => {
      const user = userEvent.setup();
      render(
        <I18nProvider initialLocale={item.locale}>
          <MemoryRouter>
            <PageRenderer page={page} />
          </MemoryRouter>
        </I18nProvider>,
      );
      await user.click(screen.getByRole("button", { name: item.button }));
      expect(screen.getByLabelText(new RegExp(`^${item.label}`))).toBeTruthy();
    });
  }
});

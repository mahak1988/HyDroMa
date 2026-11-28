import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ApiError } from "@eco-nojin/api-client";
import { ApiEmpty, ApiErrorState, ApiLoading } from "../../../src/components/ApiState";
import { CapabilityBoundary } from "../../../src/components/CapabilityBoundary";
import { moduleById } from "../../../src/services/capabilities";
import { renderWithProviders } from "./harness";

describe("ApiState", () => {
  it("renders a loading status with an accessible live region", () => {
    renderWithProviders(<ApiLoading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("maps a network error to an honest, non-technical message", () => {
    const error = new ApiError({ code: "network", status: 0, messageKey: "errors.network" });
    renderWithProviders(<ApiErrorState error={error} />);
    expect(screen.getByText(/did not respond|پاسخ نداد|لم تستجب/)).toBeInTheDocument();
  });

  it("maps a forbidden error to a role message", () => {
    const error = new ApiError({ code: "forbidden", status: 403, messageKey: "errors.forbidden" });
    renderWithProviders(<ApiErrorState error={error} />);
    expect(screen.getByText(/higher role|نقش بالاتر|دور أعلى/)).toBeInTheDocument();
  });

  it("renders an empty state that states data is real but absent", () => {
    renderWithProviders(<ApiEmpty />);
    expect(screen.getByText(/No data recorded|هنوز داده/)).toBeInTheDocument();
  });
});

describe("CapabilityBoundary", () => {
  it("discloses a backend-blocked module honestly and shows no fake data", () => {
    const module = moduleById("inventory")!;
    renderWithProviders(<CapabilityBoundary module={module} />);
    expect(screen.getByText(/not connected yet|هنوز به سرویس متصل نیست/)).toBeInTheDocument();
    expect(screen.getByText(/Blocked by backend|مسدود به‌دلیل/)).toBeInTheDocument();
    // The precise missing capability is shown.
    expect(screen.getByText(/stock, warehouse, movement, ledger or FEFO/)).toBeInTheDocument();
  });

  it("classifies an owner-decision blocker distinctly from a backend blocker", () => {
    // EcoCoin (M10) is now implemented; the owner-decision boundary is exercised
    // with a synthetic module so the distinct label stays covered.
    const module = {
      id: "demo-owner-decision",
      code: "M99",
      title: { fa: "نمونه", en: "Sample", ar: "نموذج" },
      route: "/platform/demo",
      status: "BLOCKED_BY_OWNER_DECISION" as const,
      api: [],
      missing: "Requires a legal sign-off.",
    };
    renderWithProviders(<CapabilityBoundary module={module} />);
    expect(screen.getByText(/owner decision|تصمیم مالک/)).toBeInTheDocument();
  });
});
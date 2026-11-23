import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AppShell, Breadcrumbs, PageHeader } from "../src/shell";
import type { NavGroup } from "../src/shell";

const groups: NavGroup[] = [
  { label: "Overview", items: [{ to: "/", label: "Home", end: true }] },
  {
    label: "Workspace",
    items: [
      { to: "/users", label: "Users", permission: "users.read" },
      { to: "/settings", label: "Settings", permission: "org.update" },
    ],
  },
];

function renderShell(props: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <AppShell
        brand="Console"
        groups={groups}
        content={<div data-testid="content">page</div>}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("renders brand, all nav groups and the content", () => {
    renderShell();
    assert_brand();
    assert_nav();
    assert_content();
  });

  it("marks the active route with aria-current=page", () => {
    renderShell();
    const users = screen.getByRole("link", { name: "Users" });
    expect(users.getAttribute("aria-current")).toBe("page");
    const home = screen.getByRole("link", { name: "Home" });
    expect(home.getAttribute("aria-current")).toBeNull();
  });

  it("filters items by permission via can()", () => {
    renderShell({ can: (p) => (p ? p === "users.read" : true) });
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
    expect(screen.getByRole("link", { name: "Users" })).toBeTruthy();
  });

  it("has a skip link and header/nav/main landmarks", () => {
    renderShell();
    expect(screen.getByRole("link", { name: /skip to content/i })).toBeTruthy();
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("toggles sidebar collapse via the collapse button", () => {
    renderShell();
    const collapseBtn = screen.getByLabelText(/collapse sidebar/i);
    fireEvent.click(collapseBtn);
    expect(screen.getByLabelText(/expand sidebar/i)).toBeTruthy();
  });

  it("opens the mobile menu button", () => {
    renderShell();
    expect(screen.getByRole("button", { name: /^menu$/i })).toBeTruthy();
  });
});

describe("PageHeader", () => {
  it("renders title and subtitle", () => {
    render(<PageHeader title="Users" subtitle="Manage users" />);
    expect(screen.getByRole("heading", { level: 1, name: "Users" })).toBeTruthy();
    expect(screen.getByText("Manage users")).toBeTruthy();
  });
});

describe("Breadcrumbs", () => {
  it("renders items and marks the last as current page", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs label="Breadcrumb" items={[{ label: "Home", to: "/" }, { label: "Users" }]} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Breadcrumb")).toBeTruthy();
    expect(screen.getByText("Users").getAttribute("aria-current")).toBe("page");
  });
});

function assert_brand() {
  expect(screen.getAllByText("Console").length).toBeGreaterThanOrEqual(1);
}
function assert_nav() {
  expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Users" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
}
function assert_content() {
  expect(screen.getByTestId("content")).toBeTruthy();
}
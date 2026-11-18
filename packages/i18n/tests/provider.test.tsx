import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useI18n } from "../src/provider";

function Probe() {
  const { t, tp, format, locale, dir, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="app">{t("common.appName")}</span>
      <span data-testid="plural-1">{tp("plural.notifications", 1)}</span>
      <span data-testid="plural-3">{tp("plural.notifications", 3)}</span>
      <span data-testid="number">{format.number(12450)}</span>
      <button type="button" onClick={() => setLocale("en")}>
        switch
      </button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
  window.localStorage.clear();
});

describe("i18n provider", () => {
  it("defaults to Persian, RTL and localized digits", async () => {
    render(
      <I18nProvider initialLocale="fa">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("fa");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
    expect(document.documentElement.lang).toBe("fa");
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByTestId("app")).toHaveTextContent("اکو نوژین");
    expect(screen.getByTestId("number").textContent).toMatch(/[۰-۹]/);
  });

  it("switches locale without a reload and updates direction", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initialLocale="fa">
        <Probe />
      </I18nProvider>,
    );
    await user.click(screen.getByRole("button", { name: "switch" }));
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(screen.getByTestId("app")).toHaveTextContent("Eco Nojin");
  });

  it("uses CLDR plural categories", () => {
    render(
      <I18nProvider initialLocale="en">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("plural-1")).toHaveTextContent("1 unread notification");
    expect(screen.getByTestId("plural-3")).toHaveTextContent("3 unread notifications");
  });

  it("uses Persian digits for Arabic-script numbering system", () => {
    render(
      <I18nProvider initialLocale="fa">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("number").textContent).not.toContain("12");
  });
});
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { I18nProvider } from "../src/provider";

function setNavigatorLanguages(langs: string[]) {
  Object.defineProperty(window.navigator, "languages", { value: langs, configurable: true });
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = "";
  document.documentElement.dir = "";
});

describe("locale detection", () => {
  it("uses the browser language when there is no stored preference", () => {
    window.localStorage.clear();
    setNavigatorLanguages(["ar-EG", "en-US"]);
    render(
      <I18nProvider>
        <div>x</div>
      </I18nProvider>,
    );
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("maps a regional tag to its base locale (fa-IR -> fa)", () => {
    window.localStorage.clear();
    setNavigatorLanguages(["fa-IR"]);
    render(
      <I18nProvider>
        <div>x</div>
      </I18nProvider>,
    );
    expect(document.documentElement.lang).toBe("fa");
  });

  it("falls back to the default locale when the browser language is unsupported", () => {
    window.localStorage.clear();
    setNavigatorLanguages(["zz-ZZ", "xx-XX"]);
    render(
      <I18nProvider>
        <div>x</div>
      </I18nProvider>,
    );
    expect(document.documentElement.lang).toBe("fa");
  });

  it("persists an explicit stored choice over the browser language", () => {
    window.localStorage.setItem("eco.locale", "en");
    setNavigatorLanguages(["ar-EG"]);
    render(
      <I18nProvider>
        <div>x</div>
      </I18nProvider>,
    );
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });
});
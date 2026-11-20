import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICON_NAMES, Icon } from "../src";

describe("domain icons", () => {
  it("ships the full domain set", () => {
    expect(ICON_NAMES.length).toBe(30);
    expect(new Set(ICON_NAMES).size).toBe(30);
  });

  it("renders every icon without crashing and keeps a viewBox", () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(<Icon name={name} />);
      const svg = container.querySelector("svg");
      expect(svg, name).not.toBeNull();
      expect(svg?.getAttribute("viewBox"), name).toBeTruthy();
      expect(svg?.getAttribute("aria-hidden"), name).toBe("true");
      unmount();
    }
  });

  it("is decorative unless a title is provided", () => {
    const plain = render(<Icon name="catchment" />);
    expect(plain.container.querySelector("svg")?.getAttribute("role")).toBeNull();
    plain.unmount();

    const labelled = render(<Icon name="catchment" title="حوضه آبخیز" />);
    const svg = labelled.container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(labelled.getByTitle("حوضه آبخیز")).toBeTruthy();
  });

  it("inherits color and size", () => {
    const { container } = render(<Icon name="water" size={32} className="text-primary" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
  });
});
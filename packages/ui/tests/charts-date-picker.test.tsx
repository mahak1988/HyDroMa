import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  BarChart,
  ChartLegend,
  DatePicker,
  DonutChart,
  LineChart,
  Panel,
  Sparkline,
} from "../src/index";

describe("DatePicker", () => {
  it("shows a localised (Jalali) caption for a Persian locale", () => {
    render(<DatePicker id="d1" value="2026-06-15" onChange={() => {}} locale="fa-IR" calendar="persian" />);
    const caption = screen.queryByText((content) => content.includes("۱۴۰۵") || content.includes("1405"));
    expect(caption).not.toBeNull();
  });

  it("shows a Gregorian caption for an English locale", () => {
    render(<DatePicker id="d2" value="2026-06-15" onChange={() => {}} locale="en-US" />);
    expect(screen.getByText(/2026/)).toBeTruthy();
  });

  it("renders no caption when no date is selected", () => {
    const { container } = render(<DatePicker id="d3" value="" onChange={() => {}} locale="fa-IR" />);
    expect(container.querySelector("input")?.getAttribute("value")).toBe("");
    expect(container.querySelector("p")).toBeNull();
  });

  it("exposes an explicit aria-label for assistive technology", () => {
    render(<DatePicker id="d6" value="2026-06-15" onChange={() => {}} ariaLabel="Arrival date" />);
    expect(screen.getByLabelText("Arrival date")).toBeTruthy();
  });
});

describe("F-07: DatePicker input validation", () => {
  it("accepts a valid ISO date and shows its localised form", () => {
    render(<DatePicker id="v1" value="2026-06-15" onChange={() => {}} locale="en-US" />);
    expect(screen.getByText(/June 15, 2026/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects an impossible calendar date instead of rolling it over", () => {
    // 2026 is not a leap year: a silent rollover would show 1 March.
    const { container } = render(<DatePicker id="v2" value="2026-02-29" onChange={() => {}} locale="en-US" />);
    expect(container.querySelector('input[aria-invalid="true"]')).not.toBeNull();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByText(/March 1, 2026/)).toBeNull();
  });

  it("accepts a real leap day", () => {
    render(<DatePicker id="v3" value="2028-02-29" onChange={() => {}} locale="en-US" />);
    expect(screen.getByText(/February 29, 2028/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects out-of-range and malformed values", () => {
    for (const value of ["2026-13-01", "2026-00-10", "2026-04-31", "15-06-2026", "not-a-date"]) {
      const { container, unmount } = render(<DatePicker id="v4" value={value} onChange={() => {}} />);
      expect(container.querySelector('input[aria-invalid="true"]'), value).not.toBeNull();
      unmount();
    }
  });

  it("treats an empty value as unset, not invalid", () => {
    const { container } = render(<DatePicker id="v5" value="" onChange={() => {}} />);
    expect(container.querySelector('input[aria-invalid="true"]')).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("forwards an out-of-range value from an API without shifting the day", () => {
    // A caller-supplied value outside min/max is still the same calendar day.
    const { container } = render(
      <DatePicker id="v6" value="2026-06-15" min="2026-07-01" onChange={() => {}} locale="en-US" />,
    );
    expect(container.querySelector("input")?.getAttribute("min")).toBe("2026-07-01");
    expect(screen.getByText(/June 15, 2026/)).toBeTruthy();
  });

  it("reports the ISO value chosen by the user", () => {
    const onChange = vi.fn();
    const { container } = render(<DatePicker id="d4" value="2026-06-15" onChange={onChange} locale="fa-IR" />);
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-07-01" } });
    expect(onChange).toHaveBeenCalledWith("2026-07-01");
  });
  it("forwards min and max to the native input", () => {
    render(<DatePicker id="d5" value="2026-06-15" min="2026-06-16" max="2026-07-01" onChange={() => {}} />);
    const input = document.getElementById("d5") as HTMLInputElement;
    expect(input.getAttribute("min")).toBe("2026-06-16");
    expect(input.getAttribute("max")).toBe("2026-07-01");
  });
});

describe("LineChart", () => {
  it("renders an accessible chart with a text alternative", () => {
    render(<LineChart data={[1, 2, 3]} unit="mm" label="Precipitation" />);
    expect(screen.getByRole("img", { name: /Precipitation/ })).toBeTruthy();
    expect(screen.getByText(/3 points/)).toBeTruthy();
  });

  it("renders an uncertainty note when provided", () => {
    render(<LineChart data={[1, 2, 3]} unit="mm" uncertaintyPct={12} label="Soil moisture" />);
    expect(screen.getByText(/uncertainty ±12%/)).toBeTruthy();
  });

  it("does not crash on empty data", () => {
    const { container } = render(<LineChart data={[]} unit="mm" label="Empty" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

describe("BarChart", () => {
  it("renders one row per item with its unit", () => {
    render(
      <BarChart
        items={[
          { label: "Water", value: 120, unit: "mm" },
          { label: "Soil", value: 80, unit: "mm", highlight: true },
        ]}
      />,
    );
    expect(screen.getByText("Water")).toBeTruthy();
    expect(screen.getByText(/120/)).toBeTruthy();
  });
});

describe("DonutChart", () => {
  it("renders the segments and centre label", () => {
    render(
      <DonutChart
        label="Land use"
        centerLabel="3"
        segments={[
          { label: "Forest", value: 3 },
          { label: "Farm", value: 1 },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "Land use" })).toBeTruthy();
    expect(screen.getByText("Forest")).toBeTruthy();
  });

  it("survives a zero total", () => {
    render(<DonutChart label="Zero" segments={[{ label: "None", value: 0 }]} />);
    expect(screen.getByText("None")).toBeTruthy();
  });
});

describe("Sparkline", () => {
  it("renders nothing without data", () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a path with data", () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />);
    expect(container.querySelector("svg path")).toBeTruthy();
  });
});

describe("ChartLegend", () => {
  it("renders a label per item", () => {
    render(
      <ChartLegend
        items={[
          { label: "Stations", shape: "circle" },
          { label: "Density", shape: "fill" },
          { label: "Trend", shape: "line" },
        ]}
      />,
    );
    expect(screen.getByText("Stations")).toBeTruthy();
    expect(screen.getByText("Density")).toBeTruthy();
    expect(screen.getByText("Trend")).toBeTruthy();
  });
});

describe("Panel", () => {
  it("renders title, subtitle, action and footer", () => {
    render(
      <Panel title="Water" subtitle="Demo" action={<button type="button">Export</button>} footer={<span>foot</span>}>
        <p>body</p>
      </Panel>,
    );
    expect(screen.getByRole("heading", { name: "Water" })).toBeTruthy();
    expect(screen.getByText("Demo")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    expect(screen.getByText("foot")).toBeTruthy();
  });
});
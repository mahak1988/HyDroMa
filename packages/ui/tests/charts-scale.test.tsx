import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LineChart, Sparkline, scaleSeries, summarizeSeries } from "../src/index";

/**
 * Regression tests for F-01: min/max must not be computed with the spread
 * operator, which throws once a series exceeds the engine's argument limit
 * (measured at ~150 000 points).
 *
 * The performance assertions are deliberately *not* timing-based: they assert
 * that the call completes and produces a bounded, well-formed result.
 */
const PAD = 8;
const H = 180;
const HEIGHT = H - PAD * 2;

describe("summarizeSeries", () => {
  it("handles a 20 000 point series", () => {
    const values = Array.from({ length: 20_000 }, (_, index) => Math.sin(index / 50) * 100);
    const summary = summarizeSeries(values);
    expect(summary.finiteCount).toBe(20_000);
    expect(summary.allFinite).toBe(true);
    expect(summary.min).toBeLessThan(summary.max);
  });

  it("handles a 150 000 point series without throwing", () => {
    const values = new Array<number>(150_000).fill(0).map((_, index) => index / 1000);
    let summary: ReturnType<typeof summarizeSeries> | null = null;
    expect(() => {
      summary = summarizeSeries(values);
    }).not.toThrow();
    expect(summary).not.toBeNull();
    expect(summary!.finiteCount).toBe(150_000);
    expect(summary!.max).toBeCloseTo(149.999, 3);
  });

  it("scales a 150 000 point series in one pass", () => {
    const values = new Array<number>(150_000).fill(1);
    const scale = scaleSeries(values);
    expect(scale.min).toBe(1);
    expect(scale.max).toBe(1);
    // Constant series is centred, not pinned to the baseline.
    expect(scale.y(1)).toBe(PAD + HEIGHT / 2);
  });

  it("ignores non-finite values instead of poisoning min/max", () => {
    const summary = summarizeSeries([1, Number.NaN, 3, Number.POSITIVE_INFINITY]);
    expect(summary.finiteCount).toBe(2);
    expect(summary.allFinite).toBe(false);
    expect(summary.min).toBe(1);
    expect(summary.max).toBe(3);
  });

  it("reports an empty series explicitly", () => {
    const summary = summarizeSeries([]);
    expect(summary).toEqual({ min: 0, max: 0, finiteCount: 0, allFinite: false });
  });

  it("reports an all-invalid series explicitly", () => {
    const summary = summarizeSeries([Number.NaN, Number.NEGATIVE_INFINITY]);
    expect(summary.finiteCount).toBe(0);
  });
});

describe("scaleSeries", () => {
  it("maps a negative range correctly", () => {
    const scale = scaleSeries([-10, 0, 10]);
    expect(scale.y(-10)).toBeCloseTo(PAD + HEIGHT, 5);
    expect(scale.y(0)).toBeCloseTo(PAD + HEIGHT / 2, 5);
    expect(scale.y(10)).toBeCloseTo(PAD, 5);
  });

  it("centres a constant series instead of pinning it to the baseline", () => {
    const scale = scaleSeries([7, 7, 7]);
    expect(scale.y(7)).toBe(PAD + HEIGHT / 2);
    expect(scale.y(7)).toBeLessThan(PAD + HEIGHT);
  });

  it("places a single point in the centre", () => {
    const scale = scaleSeries([5]);
    expect(scale.y(5)).toBe(PAD + HEIGHT / 2);
    expect(scale.x(0)).toBe(PAD);
  });

  it("keeps min/max truthful for a flat series", () => {
    const scale = scaleSeries([7, 7]);
    expect(scale.min).toBe(7);
    expect(scale.max).toBe(7);
  });
});

describe("LineChart with large and degenerate input", () => {
  it("renders a 20 000 point series", () => {
    const values = Array.from({ length: 20_000 }, (_, index) => Math.sin(index / 100) * 10);
    const { container } = render(<LineChart data={values} unit="mm" label="Large" />);
    expect(container.querySelector("svg path[stroke]")).toBeTruthy();
    expect(screen.getByText(/20000 of 20000 points/)).toBeTruthy();
  });

  it("states honestly when the series is empty", () => {
    render(<LineChart data={[]} unit="mm" label="Empty" />);
    expect(screen.getByText(/no finite values/)).toBeTruthy();
    expect(screen.queryByText(/points, from/)).toBeNull();
  });

  it("breaks the line at a gap and reports the missing points", () => {
    const { container } = render(<LineChart data={[1, Number.NaN, 3]} unit="mm" label="Gap" />);
    const path = container.querySelector("svg path[stroke]")?.getAttribute("d") ?? "";
    // Two separate subpaths ("M") because the middle value is not finite.
    expect(path.match(/M/g)?.length).toBe(2);
    expect(screen.getByText(/2 of 3 points/)).toBeTruthy();
    expect(screen.getByText(/missing values skipped/)).toBeTruthy();
  });

  it("does not render an area fill when data is missing", () => {
    const withGap = render(<LineChart data={[1, Number.NaN, 3]} unit="mm" label="Gap" />);
    expect(withGap.container.querySelector('svg path[fill-opacity="0.12"]')).toBeNull();
    withGap.unmount();

    const complete = render(<LineChart data={[1, 2, 3]} unit="mm" label="Full" />);
    expect(complete.container.querySelector('svg path[fill-opacity="0.12"]')).not.toBeNull();
  });

  it("renders an all-invalid series without throwing", () => {
    const { container } = render(
      <LineChart data={[Number.NaN, Number.POSITIVE_INFINITY]} unit="mm" label="Invalid" />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByText(/no finite values/)).toBeTruthy();
  });

  it("renders a 20 000 point uncertainty band", () => {
    const values = Array.from({ length: 20_000 }, (_, index) => 100 + Math.sin(index / 100));
    const { container } = render(<LineChart data={values} unit="mm" uncertaintyPct={10} label="Band" />);
    expect(container.querySelector('svg path[fill-opacity="0.14"]')).not.toBeNull();
  });
});

describe("Sparkline with degenerate input", () => {
  it("renders nothing for empty or all-invalid data", () => {
    const empty = render(<Sparkline data={[]} />);
    expect(empty.container.querySelector("svg")).toBeNull();
    empty.unmount();

    const invalid = render(<Sparkline data={[Number.NaN]} />);
    expect(invalid.container.querySelector("svg")).toBeNull();
  });

  it("renders a 20 000 point series", () => {
    const values = Array.from({ length: 20_000 }, (_, index) => index % 7);
    const { container } = render(<Sparkline data={values} />);
    expect(container.querySelector("svg path")).toBeTruthy();
  });
});
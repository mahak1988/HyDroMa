import { BarChart, DonutChart, LineChart, Sparkline } from "./charts";
import { createChartRegistry, type ChartRegistry } from "./chart-registry";

export function defaultChartRegistry(): ChartRegistry {
  const registry = createChartRegistry();
  registry.register({
    id: "bar",
    label: "Bar chart",
    render: (p) => {
      const items = Array.isArray(p.data) ? p.data : [];
      return <BarChart items={items as never} />;
    },
  });
  registry.register({
    id: "line",
    label: "Line chart",
    render: (p) => {
      const data = Array.isArray(p.data) ? (p.data as number[]) : [];
      return <LineChart data={data} unit="" label="" />;
    },
  });
  registry.register({
    id: "donut",
    label: "Donut chart",
    render: (p) => {
      const segments = Array.isArray(p.data) ? p.data : [];
      return <DonutChart segments={segments as never} label="" />;
    },
  });
  registry.register({
    id: "sparkline",
    label: "Sparkline",
    render: (p) => {
      const data = Array.isArray(p.data) ? (p.data as number[]) : [];
      return <Sparkline data={data} />;
    },
  });
  return registry;
}
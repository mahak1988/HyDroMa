import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import "../styles/index.css";
import { WorkspaceProvider } from "./WorkspaceContext";
import { ScienceLayout } from "./ScienceLayout";

function page(loader: () => Promise<unknown>) {
  return lazy(async () => {
    const module = (await loader()) as Record<string, unknown>;
    return { default: module[Object.keys(module)[0]!] as React.ComponentType };
  });
}

const DashboardPage = page(() => import("../pages/DashboardPage"));
const WaterPage = page(() => import("../pages/WaterPage"));
const SoilPage = page(() => import("../pages/SoilPage"));
const ClimatePage = page(() => import("../pages/ClimatePage"));
const VegetationPage = page(() => import("../pages/VegetationPage"));
const RemoteSensingPage = page(() => import("../pages/RemoteSensingPage"));
const MapPage = page(() => import("../pages/MapPage"));
const SimulationPage = page(() => import("../pages/SimulationPage"));
const ScenariosPage = page(() => import("../pages/ScenariosPage"));
const ProjectsPage = page(() => import("../pages/ProjectsPage"));
const ModelsPage = page(() => import("../pages/ModelsPage"));
const RunModelPage = page(() => import("../pages/RunModelPage"));
const NotFoundPage = page(() => import("../pages/NotFoundPage"));

function Loading() {
  return (
    <div role="status" aria-live="polite" className="p-6 text-sm text-fg-muted">
      …
    </div>
  );
}

/**
 * Persistent demo boundary for the scientific demonstration pages.
 *
 * The production HyDroMA views (`/science/models`, `/science/run`) stay outside
 * this boundary; every synthetic indicator page is mounted under `/science/demo`
 * so a direct URL cannot present demonstration data as operational output.
 */
function ScienceDemoBoundary() {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div
        role="note"
        aria-label={t("hydro.statusDemo")}
        className="rounded-lg border border-warning-soft bg-warning-soft/40 px-3 py-2 text-xs text-warning-soft-fg"
      >
        <strong className="me-2 font-semibold">{t("hydro.statusDemo")}</strong>
        <span>{t("hydro.disclaimerBody")}</span>
      </div>
      <Outlet />
    </div>
  );
}

const DEMO_ALIASES = [
  ["water", "water"],
  ["soil", "soil"],
  ["climate", "climate"],
  ["vegetation", "vegetation"],
  ["remote-sensing", "remote-sensing"],
  ["map", "map"],
  ["simulation", "simulation"],
  ["scenarios", "scenarios"],
  ["projects", "projects"],
] as const;

/**
 * Science section router (lazy, internal to the platform SPA), mounted at
 * `/science/*`.
 *
 * Operational views: `/science/models` (real discovery) and `/science/run`
 * (real engine execution + provenance). Demonstration indicators are isolated
 * under `/science/demo/*`; the previous flat URLs redirect there so existing
 * links keep working while the demo boundary is always preserved.
 */
export default function ScienceSectionRouter() {
  return (
    <WorkspaceProvider>
      <Routes>
        <Route element={<ScienceLayout />}>
          <Route index element={<Navigate to="demo" replace />} />
          <Route path="models" element={<Suspense fallback={<Loading />}><ModelsPage /></Suspense>} />
          <Route path="run" element={<Suspense fallback={<Loading />}><RunModelPage /></Suspense>} />
          <Route path="demo" element={<ScienceDemoBoundary />}>
            <Route index element={<Suspense fallback={<Loading />}><DashboardPage /></Suspense>} />
            <Route path="water" element={<Suspense fallback={<Loading />}><WaterPage /></Suspense>} />
            <Route path="soil" element={<Suspense fallback={<Loading />}><SoilPage /></Suspense>} />
            <Route path="climate" element={<Suspense fallback={<Loading />}><ClimatePage /></Suspense>} />
            <Route path="vegetation" element={<Suspense fallback={<Loading />}><VegetationPage /></Suspense>} />
            <Route path="remote-sensing" element={<Suspense fallback={<Loading />}><RemoteSensingPage /></Suspense>} />
            <Route path="map" element={<Suspense fallback={<Loading />}><MapPage /></Suspense>} />
            <Route path="simulation" element={<Suspense fallback={<Loading />}><SimulationPage /></Suspense>} />
            <Route path="scenarios" element={<Suspense fallback={<Loading />}><ScenariosPage /></Suspense>} />
            <Route path="projects" element={<Suspense fallback={<Loading />}><ProjectsPage /></Suspense>} />
          </Route>
          {DEMO_ALIASES.map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={`/science/demo/${to}`} replace />} />
          ))}
          <Route path="*" element={<Suspense fallback={<Loading />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  );
}

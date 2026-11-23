import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
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
 * Science section router (lazy, internal to the platform SPA), mounted at
 * `/science/*`. Every page is a separate lazy chunk so MapLibre/deck.gl stay
 * out of the section entry and the initial load. The HyDroMA client is
 * untouched; unreachable engine states stay explicit.
 */
export default function ScienceSectionRouter() {
  return (
    <WorkspaceProvider>
      <Routes>
        <Route element={<ScienceLayout />}>
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
          <Route path="models" element={<Suspense fallback={<Loading />}><ModelsPage /></Suspense>} />
          <Route path="run" element={<Suspense fallback={<Loading />}><RunModelPage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<Loading />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  );
}
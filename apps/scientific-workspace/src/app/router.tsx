import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import { ScienceLayout } from "./ScienceLayout";

/** Every page is lazy: MapLibre/deck.gl stay out of the initial bundle. */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <ScienceLayout />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("../pages/DashboardPage")).DashboardPage }),
      },
      {
        path: "water",
        lazy: async () => ({ Component: (await import("../pages/WaterPage")).WaterPage }),
      },
      {
        path: "soil",
        lazy: async () => ({ Component: (await import("../pages/SoilPage")).SoilPage }),
      },
      {
        path: "climate",
        lazy: async () => ({ Component: (await import("../pages/ClimatePage")).ClimatePage }),
      },
      {
        path: "vegetation",
        lazy: async () => ({ Component: (await import("../pages/VegetationPage")).VegetationPage }),
      },
      {
        path: "remote-sensing",
        lazy: async () => ({ Component: (await import("../pages/RemoteSensingPage")).RemoteSensingPage }),
      },
      {
        path: "map",
        lazy: async () => ({ Component: (await import("../pages/MapPage")).MapPage }),
      },
      {
        path: "simulation",
        lazy: async () => ({ Component: (await import("../pages/SimulationPage")).SimulationPage }),
      },
      {
        path: "scenarios",
        lazy: async () => ({ Component: (await import("../pages/ScenariosPage")).ScenariosPage }),
      },
      {
        path: "projects",
        lazy: async () => ({ Component: (await import("../pages/ProjectsPage")).ProjectsPage }),
      },
      {
        path: "models",
        lazy: async () => ({ Component: (await import("../pages/ModelsPage")).ModelsPage }),
      },
      {
        path: "run",
        lazy: async () => ({ Component: (await import("../pages/RunModelPage")).RunModelPage }),
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("../pages/NotFoundPage")).NotFoundPage }),
      },
    ],
  },
], { basename: routerBasename(import.meta.env.BASE_URL) });
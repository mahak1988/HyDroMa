import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import { FieldLayout } from "./FieldLayout";
import { HomePage } from "../pages/HomePage";
import { SurveyPage } from "../pages/SurveyPage";
import { RecordsPage } from "../pages/RecordsPage";
import { MapPage } from "../pages/MapPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <FieldLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "survey", element: <SurveyPage /> },
      { path: "records", element: <RecordsPage /> },
      { path: "map", element: <MapPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], { basename: routerBasename(import.meta.env.BASE_URL) });
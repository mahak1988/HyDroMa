import { createBrowserRouter, Navigate } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/portal/" replace /> },
  { path: "*", element: <Navigate to="/portal/" replace /> },
], { basename: routerBasename(import.meta.env.BASE_URL) });
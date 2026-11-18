import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export function PortalApp() {
  return <RouterProvider router={router} />;
}
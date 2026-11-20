import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import { PortalLayout } from "./PortalLayout";
import { NotFoundPage, PageView } from "./PageView";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PortalLayout />,
    children: [
      { index: true, element: <PageView pageKey="home" path="/" /> },
      { path: "ecosystem", element: <PageView pageKey="ecosystem" path="/ecosystem" /> },
      { path: "hydroma", element: <PageView pageKey="hydroma" path="/hydroma" /> },
      { path: "landscape", element: <PageView pageKey="landscape" path="/landscape" /> },
      { path: "marketplace", element: <PageView pageKey="marketplace" path="/marketplace" /> },
      { path: "tourism", element: <PageView pageKey="tourism" path="/tourism" /> },
      { path: "mrv", element: <PageView pageKey="mrv" path="/mrv" /> },
      { path: "knowledge", element: <PageView pageKey="knowledge" path="/knowledge" /> },
      { path: "about", element: <PageView pageKey="about" path="/about" /> },
      { path: "contact", element: <PageView pageKey="contact" path="/contact" /> },
      { path: "partner", element: <PageView pageKey="partner" path="/partner" /> },
      { path: "login", element: <PageView pageKey="login" path="/login" /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], { basename: routerBasename(import.meta.env.BASE_URL) });
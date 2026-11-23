import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { routerBasename } from "@eco-nojin/configuration";
import { PlatformLayout } from "./PlatformLayout";
import { PortalLayout } from "../public/app/PortalLayout";
import { PageView, NotFoundPage } from "../public/app/PageView";
import { AuthPage } from "../public/app/AuthPage";
import { AccountPage } from "../public/app/AccountPage";
import { PAGES, pageById } from "../content/pages";
import { PageRenderer } from "../pages/PageRenderer";
import { EmptyState } from "@eco-nojin/ui";

function NotFound() {
  return (
    <EmptyState
      title="۴۰۴ — صفحه یافت نشد"
      body="این مسیر در پلتفرم تعریف نشده است؛ از منوی کنار یکی از سرویسها را انتخاب کنید."
    />
  );
}

/**
 * Crossing into an external section bundle is a document navigation, not a
 * client-side route change (each section is its own build behind the unified
 * host while migration is in progress).
 */
function ExternalRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.assign(href);
  }, [href]);
  return null;
}

const overview = pageById("overview");

/**
 * Internal sections are lazily loaded behind their own route prefix. Each one
 * is a separate chunk (see `src/sections/manifest.ts`); the fallback is a light
 * status message, not a full page.
 */
const TourismSection = lazy(() => import("../sections/tourism/app/router"));
const MarketSection = lazy(() => import("../sections/market/app/router"));
const LandscapeSection = lazy(() => import("../sections/landscape/router"));

function SectionFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[60dvh] place-items-center bg-canvas text-sm text-fg-muted"
    >
      بارگذاری بخش…
    </div>
  );
}

/**
 * The unified platform router: the public core at the root (migrated from the
 * portal), the platform workspace nested under `/platform`, and redirects to
 * external section bundles for areas not migrated yet.
 */
export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <PortalLayout />,
      children: [
        { index: true, element: <PageView pageKey="home" path="/" /> },
        { path: "ecosystem", element: <PageView pageKey="ecosystem" path="/ecosystem" /> },
        { path: "hydroma", element: <PageView pageKey="hydroma" path="/hydroma" /> },
        // Section landings live in their own bundles; send visitors there.
        { path: "marketplace", element: <ExternalRedirect href="/market/" /> },
        { path: "mrv", element: <PageView pageKey="mrv" path="/mrv" /> },
        { path: "knowledge", element: <PageView pageKey="knowledge" path="/knowledge" /> },
        { path: "about", element: <PageView pageKey="about" path="/about" /> },
        { path: "contact", element: <PageView pageKey="contact" path="/contact" /> },
        { path: "partner", element: <PageView pageKey="partner" path="/partner" /> },
        { path: "login", element: <AuthPage /> },
        { path: "profile", element: <AccountPage kind="profile" /> },
        { path: "security", element: <AccountPage kind="security" /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
    {
      path: "/tourism/*",
      element: (
        <Suspense fallback={<SectionFallback />}>
          <TourismSection />
        </Suspense>
      ),
    },
    {
      path: "/market/*",
      element: (
        <Suspense fallback={<SectionFallback />}>
          <MarketSection />
        </Suspense>
      ),
    },
    {
      path: "/landscape/*",
      element: (
        <Suspense fallback={<SectionFallback />}>
          <LandscapeSection />
        </Suspense>
      ),
    },
    {
      path: "/platform",
      element: <PlatformLayout />,
      children: [
        { index: true, element: <PageRenderer page={overview} /> },
        ...PAGES.filter((page) => page.path !== "").map((page) => ({
          path: page.path,
          element: <PageRenderer page={page} />,
        })),
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename: routerBasename(import.meta.env.BASE_URL) },
);

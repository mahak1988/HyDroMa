import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { routerBasename } from "@eco-nojin/configuration";
import { PlatformLayout } from "./PlatformLayout";
import { WorkspaceGate } from "./WorkspaceGate";
import { DemoLayout } from "./DemoLayout";
import { PortalLayout } from "../public/app/PortalLayout";
import { PageView, ExtraPageView, NotFoundPage } from "../public/app/PageView";
import { AuthPage } from "../public/app/AuthPage";
import { AccountPage } from "../public/app/AccountPage";
import { PAGES, pageById } from "../content/pages";
import { PageRenderer } from "../pages/PageRenderer";
import { EmptyState } from "@eco-nojin/ui";
import { CapabilityBoundary } from "../components/CapabilityBoundary";
import { ResourceDetailPage, ResourceListPage } from "../sections/api-pages/ResourcePages";
import { MarketplacePage } from "../sections/api-pages/MarketplacePage";
import { NotificationsPage } from "../sections/api-pages/NotificationsPage";
import { ModelsPage } from "../sections/api-pages/ModelsPage";
import { moduleById } from "../services/capabilities";

/**
 * Capability modules are heavy, API-backed workspaces. They are code-split so
 * the initial entry chunk stays within the bundle budget (see
 * scripts/check-bundle-budget.mjs); each becomes its own lazy chunk.
 */
const FarmsModule = lazy(() => import("../sections/agriculture/FarmsModule").then((m) => ({ default: m.FarmsModule })));
const FarmDetail = lazy(() => import("../sections/agriculture/FarmsModule").then((m) => ({ default: m.FarmDetail })));
const CropCyclesModule = lazy(() => import("../sections/agriculture/CropCyclesModule").then((m) => ({ default: m.CropCyclesModule })));
const IrrigationModule = lazy(() => import("../sections/agriculture/IrrigationModule").then((m) => ({ default: m.IrrigationModule })));
const TasksModule = lazy(() => import("../sections/agriculture/TasksModule").then((m) => ({ default: m.TasksModule })));
const TaskDetail = lazy(() => import("../sections/agriculture/TaskDetail").then((m) => ({ default: m.TaskDetail })));
const TaskSchedule = lazy(() => import("../sections/agriculture/TaskSchedule").then((m) => ({ default: m.TaskSchedule })));
const IntelligenceModule = lazy(() => import("../sections/agriculture/IntelligenceModule").then((m) => ({ default: m.IntelligenceModule })));
const ReadinessModule = lazy(() => import("../sections/agriculture/ReadinessModule").then((m) => ({ default: m.ReadinessModule })));
const HICModule = lazy(() => import("../sections/agriculture/HICModule").then((m) => ({ default: m.HICModule })));
const EnvSourcesModule = lazy(() => import("../sections/agriculture/EnvSourcesModule").then((m) => ({ default: m.EnvSourcesModule })));
const FieldObservationsModule = lazy(() => import("../sections/agriculture/FieldObservationsModule").then((m) => ({ default: m.FieldObservationsModule })));
const OverviewModule = lazy(() => import("../sections/agriculture/OverviewModule").then((m) => ({ default: m.OverviewModule })));
const HydromaWorkspace = lazy(() => import("../sections/agriculture/HydromaWorkspace").then((m) => ({ default: m.HydromaWorkspace })));
const HydromaRunPage = lazy(() => import("../sections/science/pages/RunModelPage").then((m) => ({ default: m.RunModelPage })));const EnvDataModule = lazy(() => import("../sections/agriculture/EnvDataModule").then((m) => ({ default: m.EnvDataModule })));
const DatasetBuilderModule = lazy(() => import("../sections/agriculture/DatasetBuilderModule").then((m) => ({ default: m.DatasetBuilderModule })));
const ProjectsModule = lazy(() => import("../sections/projects/ProjectsModule").then((m) => ({ default: m.ProjectsModule })));
const ProjectDetail = lazy(() => import("../sections/projects/ProjectsModule").then((m) => ({ default: m.ProjectDetail })));
const ChallengesModule = lazy(() => import("../sections/rewards/ChallengesModule").then((m) => ({ default: m.ChallengesModule })));
const RewardsModule = lazy(() => import("../sections/rewards/RewardsModule").then((m) => ({ default: m.RewardsModule })));
const TerritoriesModule = lazy(() => import("../sections/territory/TerritoriesModule").then((m) => ({ default: m.TerritoriesModule })));
const VillagesModule = lazy(() => import("../sections/communities/VillagesModule").then((m) => ({ default: m.VillagesModule })));
const CommunityWorkspace = lazy(() => import("../sections/communities/CommunityWorkspace").then((m) => ({ default: m.CommunityWorkspace })));

function NotFound() {
  return (
    <EmptyState
      title="۴۰۴ — صفحه یافت نشد"
      body="این مسیر در پلتفرم تعریف نشده است؛ از منوی کنار یکی از سرویسها را انتخاب کنید."
    />
  );
}

/**
 * Capability-aware canonical module entries (M01…M18).
 *
 * These render REAL API-backed pages where the backend supports the module, an
 * honest capability boundary where it does not, and are matched before the
 * legacy `PAGES` registry so the canonical module route is authoritative. No
 * demo data is presented as operational on these entries.
 */
const capabilityRoutes = [
  { path: "territories", element: <TerritoriesModule /> },
  { path: "landscapes", element: <TerritoriesModule /> },
  { path: "communities/:id", element: <CommunityWorkspace /> },
  { path: "communities", element: <VillagesModule /> },
  { path: "natural-resources", element: <ResourceListPage type="sites" /> },
  { path: "hydroma/sources", element: <EnvSourcesModule /> },
  { path: "hydroma/readiness", element: <ReadinessModule /> },
 { path: "hydroma/irrigation", element: <HydromaWorkspace /> },
 { path: "hydroma/environment", element: <EnvDataModule /> },
 { path: "hydroma/datasets", element: <DatasetBuilderModule /> },
  { path: "hic", element: <HICModule /> },
  { path: "hydroma", element: <ModelsPage /> },
  { path: "hydroma/run", element: <HydromaRunPage /> },
  { path: "agriculture/intelligence", element: <IntelligenceModule /> },
  { path: "agriculture/:id", element: <FarmDetail /> },
  { path: "irrigation", element: <IrrigationModule /> },
  { path: "tasks/schedule", element: <TaskSchedule /> },
  { path: "tasks/:id", element: <TaskDetail /> },
  { path: "tasks", element: <TasksModule /> },
  { path: "agriculture", element: <FarmsModule /> },
  { path: "agriculture/cycles", element: <CropCyclesModule /> },
  { path: "agriculture/irrigation", element: <IrrigationModule /> },
  { path: "agriculture/observations", element: <FieldObservationsModule /> },
  { path: "tourism", element: <CapabilityBoundary module={moduleById("tourism")!} /> },
  { path: "marketplace", element: <MarketplacePage /> },
  { path: "inventory", element: <CapabilityBoundary module={moduleById("inventory")!} /> },
  { path: "finance", element: <CapabilityBoundary module={moduleById("finance")!} /> },
  { path: "ecocoin", element: <RewardsModule /> },
  { path: "challenges", element: <ChallengesModule /> },
  { path: "community", element: <NotificationsPage /> },
  { path: "projects/:id", element: <ProjectDetail /> },
  { path: "projects", element: <ProjectsModule /> },
  { path: "field", element: <ResourceListPage type="surveys" /> },
  { path: "mrv", element: <ResourceListPage type="sites" /> },
  { path: "knowledge", element: <ResourceListPage type="articles" /> },
  { path: "reports", element: <ResourceListPage type="reports" /> },
  { path: "administration", element: <CapabilityBoundary module={moduleById("administration")!} /> },
  { path: "landscapes/:id", element: <ResourceDetailPage type="landscapes" /> },
  { path: "villages/:id", element: <ResourceDetailPage type="villages" /> },
  { path: "farms/:id", element: <ResourceDetailPage type="farms" /> },
  { path: "sites/:id", element: <ResourceDetailPage type="sites" /> },
  { path: "articles/:id", element: <ResourceDetailPage type="articles" /> },
  { path: "surveys/:id", element: <ResourceDetailPage type="surveys" /> },
  { path: "reports/:id", element: <ResourceDetailPage type="reports" /> },
];

/**
 * Internal sections are lazily loaded behind their own route prefix. Each one
 * is a separate chunk (see `src/sections/manifest.ts`); the fallback is a light
 * status message, not a full page.
 */
const TourismSection = lazy(() => import("../sections/tourism/app/router"));
const MarketSection = lazy(() => import("../sections/market/app/router"));
const LandscapeSection = lazy(() => import("../sections/landscape/router"));
const ScienceSection = lazy(() => import("../sections/science/app/router"));

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
export const appRoutes = [
    {
      path: "/",
      element: <PortalLayout />,
      children: [
        { index: true, element: <PageView pageKey="home" path="/" /> },
        { path: "ecosystem", element: <PageView pageKey="ecosystem" path="/ecosystem" /> },
        { path: "hydroma", element: <PageView pageKey="hydroma" path="/hydroma" /> },
        // Public marketplace intro (real content); the live catalog is in the workspace.
        { path: "marketplace", element: <ExtraPageView pageKey="marketplace" path="/marketplace" /> },
        { path: "mrv", element: <PageView pageKey="mrv" path="/mrv" /> },
        { path: "knowledge", element: <PageView pageKey="knowledge" path="/knowledge" /> },
        { path: "about", element: <PageView pageKey="about" path="/about" /> },
        { path: "vision", element: <ExtraPageView pageKey="vision" path="/vision" /> },
        { path: "impact", element: <ExtraPageView pageKey="impact" path="/impact" /> },
        { path: "landscapes", element: <PageView pageKey="landscape" path="/landscapes" /> },
        { path: "projects", element: <ExtraPageView pageKey="projects" path="/projects" /> },
        { path: "technology", element: <PageView pageKey="hydroma" path="/technology" /> },
        { path: "partners", element: <PageView pageKey="partner" path="/partners" /> },
        { path: "accessibility", element: <ExtraPageView pageKey="accessibility" path="/accessibility" /> },
        { path: "privacy", element: <ExtraPageView pageKey="privacy" path="/privacy" /> },
        { path: "terms", element: <ExtraPageView pageKey="terms" path="/terms" /> },
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
      path: "/science/*",
      element: (
        <Suspense fallback={<SectionFallback />}>
          <ScienceSection />
        </Suspense>
      ),
    },
    {
      path: "/platform",
      element: (
        <WorkspaceGate>
          <PlatformLayout />
        </WorkspaceGate>
      ),
      children: [
        { index: true, element: <Suspense fallback={<SectionFallback />}><OverviewModule /></Suspense> },
        ...capabilityRoutes.map((route) => ({
          path: route.path,
          element: <Suspense fallback={<SectionFallback />}>{route.element}</Suspense>,
        })),
        {
          element: <DemoLayout />,
          children: [
            { path: "demo", element: <PageRenderer page={pageById("overview") ?? PAGES[0]!} /> },
            ...PAGES.filter((page) => page.path !== "").map((page) => ({
              path: page.path,
              element: <PageRenderer page={page} />,
            })),
          ],
        },
        { path: "*", element: <NotFound /> },
      ],
    },
];

export const router = createBrowserRouter(appRoutes, {
  basename: routerBasename(import.meta.env.BASE_URL),
});

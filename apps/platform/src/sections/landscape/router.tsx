import { Route, Routes } from "react-router-dom";
import "./field/styles/index.css";
import { EmptyState } from "@eco-nojin/ui";
import { PlatformLayout } from "../../app/PlatformLayout";
import { PageRenderer } from "../../pages/PageRenderer";
import { LANDSCAPE_PAGES, pageById, type PageDef } from "../../content/pages";
import { ObservationProvider } from "./field/store/observations";
import { FieldLayout } from "./field/app/FieldLayout";
import { HomePage as FieldHomePage } from "./field/pages/HomePage";
import { SurveyPage as FieldSurveyPage } from "./field/pages/SurveyPage";
import { RecordsPage as FieldRecordsPage } from "./field/pages/RecordsPage";
import { MapPage as FieldMapPage } from "./field/pages/MapPage";
import AdminSectionRouter from "./admin/router";

/**
 * Landscape management section (lazy, internal to the platform SPA).
 *
 * Mounted at `/landscape/*`. It reuses the platform workspace shell and page
 * renderer with a landscape-only registry, so the section and the workspace stay
 * in sync without duplicate page definitions.
 */
const DETAIL_BASE = "/landscape/landscapes";
const LANDSCAPE_SECTIONS = ["landscape"] as const;

const DASHBOARD = pageById("landscape-dashboard");

function renderPage(page: PageDef) {
  return <PageRenderer page={page} detailBase={DETAIL_BASE} />;
}

export default function LandscapeSectionRouter() {
  return (
    <Routes>
      <Route
        element={
          <PlatformLayout basePath="/landscape" sections={[...LANDSCAPE_SECTIONS]} pages={LANDSCAPE_PAGES} />
        }
      >
        <Route index element={renderPage(DASHBOARD)} />
        {LANDSCAPE_PAGES.filter((page) => page.path !== "").map((page) => (
          <Route key={page.id} path={page.path} element={renderPage(page)} />
        ))}
        <Route
          path="field"
          element={
            <ObservationProvider>
              <FieldLayout />
            </ObservationProvider>
          }
        >
          <Route index element={<FieldHomePage />} />
          <Route path="survey" element={<FieldSurveyPage />} />
          <Route path="records" element={<FieldRecordsPage />} />
          <Route path="map" element={<FieldMapPage />} />
        </Route>
      </Route>
      <Route path="admin/*" element={<AdminSectionRouter />} />
        <Route
          path="*"
          element={<EmptyState title="۴۰۴ — صفحه یافت نشد" body="این مسیر در بخش مدیریت منظر تعریف نشده است." />}
        />
    </Routes>
  );
}
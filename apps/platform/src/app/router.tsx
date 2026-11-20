import { createBrowserRouter } from "react-router-dom";
import { routerBasename } from "@eco-nojin/configuration";
import { PlatformLayout } from "./PlatformLayout";
import { PAGES, pageById } from "../content/pages";
import { PageRenderer } from "../pages/PageRenderer";
import { EmptyState } from "@eco-nojin/ui";

function NotFound() {
  return (
    <EmptyState
      title="۴۰۴ — صفحه یافت نشد"
      body="این مسیر در پلتفرم تعریف نشده است؛ از منوی کنار یکی از سرویس‌ها را انتخاب کنید."
    />
  );
}

const overview = pageById("overview");

/**
 * Every page in `content/pages.ts` becomes a route here; the registry is the
 * single source of truth for navigation, routing and the page itself.
 */
export const router = createBrowserRouter(
  [
    {
      path: "/",
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

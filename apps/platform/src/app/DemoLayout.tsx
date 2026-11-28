import { Link, Outlet } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { UI, t } from "../content/ui";

/**
 * Demo boundary for registry-driven pages.
 *
 * Every route rendered by `PageRenderer` is wrapped here. The banner is part of
 * the route element (not a dismissible toast), so direct URL access shows the
 * same boundary as in-app navigation: demo data can never be presented as an
 * operational organization record.
 */
export function DemoLayout() {
  const { locale } = useI18n();
  return (
    <div className="space-y-3">
      <div
        role="note"
        aria-label={t(UI.demoBanner, locale)}
        className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-warning-soft bg-warning-soft/50 px-3 py-2 text-xs text-warning-soft-fg"
      >
        <strong className="font-semibold">{t(UI.demoBanner, locale)}</strong>
        <span>{t(UI.demoBannerBody, locale)}</span>
        <Link className="ms-auto font-medium underline underline-offset-2" to="/platform">
          {t(UI.back, locale)}
        </Link>
      </div>
      <Outlet />
    </div>
  );
}

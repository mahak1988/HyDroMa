import { Link, NavLink, Outlet } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import { Badge, Button } from "@eco-nojin/ui";

export function FieldLayout() {
  const { t, locale, locales, setLocale } = useI18n();
  const { mode, setMode } = useTheme();
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="font-semibold text-fg">{t("apps.field.homeTitle" as never)}</Link>
          <nav className="hidden gap-2 md:flex">
            <NavLink to="/" end className="rounded px-2 py-1 text-sm text-fg-muted hover:text-fg">{t("common.home" as never)}</NavLink>
            <NavLink to="/survey" className="rounded px-2 py-1 text-sm text-fg-muted hover:text-fg">{t("apps.field.surveyTitle" as never)}</NavLink>
            <NavLink to="/records" className="rounded px-2 py-1 text-sm text-fg-muted hover:text-fg">{t("apps.field.recordsTitle" as never)}</NavLink>
            <NavLink to="/map" className="rounded px-2 py-1 text-sm text-fg-muted hover:text-fg">{t("apps.field.mapTitle" as never)}</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <Badge tone="warning">demo</Badge>
            <select value={locale} onChange={(e) => setLocale(e.target.value as never)} className="h-8 rounded border border-border bg-surface px-2 text-xs">
              {locales.filter((l) => l.enabled).map((l) => <option key={l.code} value={l.code}>{l.code}</option>)}
            </select>
            <Button size="sm" variant="ghost" onClick={() => setMode(mode === "dark" ? "light" : "dark")}>{mode}</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Droplets,
  FlaskConical,
  FolderKanban,
  GitCompare,
  Globe2,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Monitor,
  Moon,
  Satellite,
  Sprout,
  Sun,
  Waves,
  X,
} from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import type { ThemeMode } from "@eco-nojin/frontend-core/theme";
import { Badge, Button, Dropdown, Select } from "@eco-nojin/ui";
import { useWorkspace } from "./WorkspaceContext";
import { DATA_UPDATED_AT, STUDY_AREAS } from "../data/indicators";
import { sciencePath } from "../lib/paths";

type NavItem = { to: string; key: string; icon: typeof LayoutDashboard; end?: boolean };

const NAV: NavItem[] = [
  { to: "/", key: "hydro.nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/water", key: "hydro.nav.water", icon: Droplets },
  { to: "/soil", key: "hydro.nav.soil", icon: Layers },
  { to: "/climate", key: "hydro.nav.climate", icon: Sun },
  { to: "/vegetation", key: "hydro.nav.vegetation", icon: Sprout },
  { to: "/remote-sensing", key: "hydro.nav.remote", icon: Satellite },
  { to: "/map", key: "hydro.nav.map", icon: MapIcon },
  { to: "/simulation", key: "hydro.nav.simulation", icon: FlaskConical },
  { to: "/scenarios", key: "hydro.nav.scenarios", icon: GitCompare },
  { to: "/projects", key: "hydro.nav.projects", icon: FolderKanban },
  { to: "/models", key: "hydroma.models", icon: Layers },
] as const;

function Brand() {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-primary text-primary-fg">
        <Waves className="size-4.5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight text-fg">{t("hydro.brand")}</span>
        <span className="hidden truncate text-2xs text-fg-subtle sm:block">{t("hydro.tagline")}</span>
      </span>
    </span>
  );
}

function LanguageMenu() {
  const { t, locale, locales, setLocale } = useI18n();
  return (
    <Dropdown
      label={t("common.language")}
      align="end"
      items={locales.map((item) => ({
        id: item.code,
        label: `${item.nativeName} — ${item.englishName}`,
        selected: item.code === locale,
        icon: <Globe2 className="size-4" aria-hidden="true" />,
        onSelect: () => setLocale(item.code),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`${t("common.language")}: ${locale.toUpperCase()}`}>
          <Globe2 className="size-4" aria-hidden="true" />
          <span className="hidden uppercase sm:inline">{locale}</span>
        </Button>
      }
    />
  );
}

function ThemeMenu() {
  const { t } = useI18n();
  const { mode, setMode } = useTheme();
  const options: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: "light", label: t("common.light"), icon: <Sun className="size-4" aria-hidden="true" /> },
    { id: "dark", label: t("common.dark"), icon: <Moon className="size-4" aria-hidden="true" /> },
    { id: "system", label: t("common.system"), icon: <Monitor className="size-4" aria-hidden="true" /> },
  ];
  return (
    <Dropdown
      label={t("common.theme")}
      align="end"
      items={options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.icon,
        selected: mode === option.id,
        onSelect: () => setMode(option.id),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`${t("common.theme")}: ${mode}`}>
          {mode === "dark" ? <Moon className="size-4" aria-hidden="true" /> : mode === "system" ? <Monitor className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
        </Button>
      }
    />
  );
}

export function ScienceLayout() {
  const { t, format } = useI18n();
  const { area, setAreaId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className="hydro-shell min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        {t("common.skipToContent")}
      </a>

      <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface/92 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[var(--container-max)] items-center gap-3 px-4 lg:px-6">
          <Link to={sciencePath("/")} className="min-w-0 shrink rounded-md">
            <Brand />
          </Link>

          <nav aria-label={t("hydro.nav.dashboard")} className="hidden flex-1 items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={sciencePath(item.to)}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                    isActive ? "bg-surface-2 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                  }`
                }
              >
                <item.icon className="size-3.5" aria-hidden="true" />
                <span className="truncate">{t(item.key as TranslationKey)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-1.5">
            <Select
              aria-label={t("hydro.dashboard.landscape")}
              className="hidden h-8 w-44 text-xs sm:block"
              value={area.id}
              onChange={(event) => setAreaId(event.target.value)}
            >
              {STUDY_AREAS.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(item.nameKey as TranslationKey)}
                </option>
              ))}
            </Select>
            <span className="hidden sm:inline-flex">
              <Badge tone="warning">{t("hydro.statusDemo")}</Badge>
            </span>
            <LanguageMenu />
            <ThemeMenu />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("common.menu")}
              className="rounded-md p-2 text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="border-t border-border bg-warning-soft/60">
          <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-2xs text-warning-soft-fg lg:px-6">
            <span className="font-medium">{t("hydro.disclaimerTitle")}</span>
            <span className="truncate opacity-90">{t("hydro.disclaimerBody")}</span>
            <span className="numeric opacity-80">
              {t("hydro.updated")}: {format.dateTime(DATA_UPDATED_AT)}
            </span>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[var(--container-max)] px-4 py-5 lg:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border px-4 py-3 text-2xs text-fg-subtle lg:px-6">
        <div className="mx-auto flex max-w-[var(--container-max)] flex-wrap items-center justify-between gap-2">
          <span>
            {t("common.appName")} · {t("hydro.brand")}
          </span>
          <span>{t("hydro.statusNotConnected")}</span>
        </div>
      </footer>

      <dialog
        ref={drawerRef}
        onCancel={() => setOpen(false)}
        aria-label={t("common.menu")}
        className="fixed inset-y-0 m-0 h-dvh max-h-none w-[min(86vw,20rem)] rounded-none border-e border-border bg-surface p-0"
        style={{ insetInlineStart: 0 }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-3">
          <Brand />
          <button type="button" onClick={() => setOpen(false)} aria-label={t("common.closeMenu")} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={t("common.menu")} className="space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-surface-2 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`
              }
            >
              <item.icon className="size-4" aria-hidden="true" />
              {t(item.key as TranslationKey)}
            </NavLink>
          ))}
        </nav>
      </dialog>
    </div>
  );
}
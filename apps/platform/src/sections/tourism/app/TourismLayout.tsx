import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Globe2, Menu, Monitor, Moon, Mountain, Search, Sun, X } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import type { ThemeMode } from "@eco-nojin/frontend-core/theme";
import { Badge, Button, Dropdown, Input } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { tourismPath } from "../lib/paths";

function Brand() {
  const { ui } = useTourism();
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-primary text-primary-fg">
        <Mountain className="size-4.5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight text-fg">{ui.brand}</span>
        <span className="hidden truncate text-2xs text-fg-subtle sm:block">{ui.tagline}</span>
      </span>
    </span>
  );
}

function LanguageMenu() {
  const { ui } = useTourism();
  const { locale, locales, setLocale } = useI18n();
  return (
    <Dropdown
      label={ui.language}
      align="end"
      items={locales.map((item) => ({
        id: item.code,
        label: `${item.nativeName} — ${item.englishName}`,
        selected: item.code === locale,
        icon: <Globe2 className="size-4" aria-hidden="true" />,
        onSelect: () => setLocale(item.code),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`${ui.language}: ${locale.toUpperCase()}`}>
          <Globe2 className="size-4" aria-hidden="true" />
          <span className="hidden uppercase sm:inline">{locale}</span>
        </Button>
      }
    />
  );
}

function ThemeMenu() {
  const { ui } = useTourism();
  const { mode, setMode } = useTheme();
  const options: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: "light", label: ui.light, icon: <Sun className="size-4" aria-hidden="true" /> },
    { id: "dark", label: ui.dark, icon: <Moon className="size-4" aria-hidden="true" /> },
    { id: "system", label: ui.system, icon: <Monitor className="size-4" aria-hidden="true" /> },
  ];
  return (
    <Dropdown
      label={ui.theme}
      align="end"
      items={options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.icon,
        selected: mode === option.id,
        onSelect: () => setMode(option.id),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`${ui.theme}: ${mode}`}>
          {mode === "dark" ? <Moon className="size-4" aria-hidden="true" /> : mode === "system" ? <Monitor className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
        </Button>
      }
    />
  );
}

export function TourismLayout() {
  const { ui, nav } = useTourism();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const submitSearch = () => {
    navigate(tourismPath(`/destinations?q=${encodeURIComponent(query.trim())}`));
    setOpen(false);
  };

  return (
    <div className="tourism-shell min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        {ui.skip}
      </a>

      <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface/92 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[var(--container-max)] items-center gap-3 px-4 lg:px-6">
          <Link to={tourismPath("/")} className="shrink-0 rounded-md">
            <Brand />
          </Link>

          <form
            className="hidden flex-1 items-center gap-2 md:flex"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label className="sr-only" htmlFor="tourism-search">
              {ui.search}
            </label>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-fg-subtle" style={{ insetInlineStart: "0.75rem" }} aria-hidden="true" />
              <Input
                id="tourism-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={ui.searchPlaceholder}
                className="ps-9"
              />
            </div>
          </form>

          <nav aria-label={ui.menu} className="ms-auto hidden items-center gap-0.5 xl:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={tourismPath(item.to)}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `relative rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isActive ? "bg-surface-2 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-flex">
              <Badge tone="warning">{ui.demo}</Badge>
            </span>
            <LanguageMenu />
            <ThemeMenu />
            <button type="button" onClick={() => setOpen(true)} aria-label={ui.menu} className="rounded-md p-2 text-fg-muted hover:bg-surface-2 hover:text-fg xl:hidden">
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[var(--container-max)] px-4 py-5 lg:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border px-4 py-6 text-2xs text-fg-subtle lg:px-6">
        <div className="mx-auto flex max-w-[var(--container-max)] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {ui.brand} · {ui.tagline}
          </span>
          <span>{ui.demoNote}</span>
        </div>
      </footer>

      <dialog
        ref={drawerRef}
        onCancel={() => setOpen(false)}
        aria-label={ui.menu}
        className="fixed inset-y-0 m-0 h-dvh max-h-none w-[min(86vw,20rem)] rounded-none border-e border-border bg-surface p-0"
        style={{ insetInlineStart: 0 }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-3">
          <Brand />
          <button type="button" onClick={() => setOpen(false)} aria-label={ui.closeMenu} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label className="sr-only" htmlFor="tourism-search-mobile">
              {ui.search}
            </label>
            <Input id="tourism-search-mobile" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ui.searchPlaceholder} />
          </form>
          <nav aria-label={ui.menu} className="mt-3 space-y-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={tourismPath(item.to)}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-surface-2 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </dialog>
    </div>
  );
}
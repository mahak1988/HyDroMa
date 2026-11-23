import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Globe2, Menu, Monitor, Moon, Sun, X } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import type { ThemeMode } from "@eco-nojin/frontend-core/theme";
import { Button, Dropdown } from "@eco-nojin/ui";
import type { TranslationKey } from "@eco-nojin/i18n";
import { NAV_SECTIONS } from "../../sections/manifest";
import { Brand } from "../components/Brand";
import { useSite } from "../content/useContent";

function LanguageMenu() {
  const { locale, locales, setLocale } = useI18n();
  const site = useSite();
  return (
    <Dropdown
      label={site.ui.language}
      align="end"
      items={locales.map((item) => ({
        id: item.code,
        label: `${item.nativeName} — ${item.englishName}`,
        selected: item.code === locale,
        icon: <Globe2 className="size-4" aria-hidden="true" />,
        onSelect: () => setLocale(item.code),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`${site.ui.language}: ${locale.toUpperCase()}`}>
          <Globe2 className="size-4" aria-hidden="true" />
          <span className="uppercase">{locale}</span>
        </Button>
      }
    />
  );
}

function ThemeMenu() {
  const site = useSite();
  const { mode, setMode } = useTheme();
  const options: Array<{ id: ThemeMode; label: string; icon: React.ReactNode }> = [
    { id: "light", label: site.ui.light, icon: <Sun className="size-4" aria-hidden="true" /> },
    { id: "dark", label: site.ui.dark, icon: <Moon className="size-4" aria-hidden="true" /> },
    { id: "system", label: site.ui.system, icon: <Monitor className="size-4" aria-hidden="true" /> },
  ];
  return (
    <Dropdown
      label={site.ui.theme}
      align="end"
      items={options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.icon,
        selected: mode === option.id,
        onSelect: () => setMode(option.id),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={site.ui.theme}>
          {mode === "dark" ? (
            <Moon className="size-4" aria-hidden="true" />
          ) : mode === "system" ? (
            <Monitor className="size-4" aria-hidden="true" />
          ) : (
            <Sun className="size-4" aria-hidden="true" />
          )}
        </Button>
      }
    />
  );
}

function SectionsMenu() {
  const { t } = useI18n();
  return (
    <Dropdown
      label={t("apps.sections.label")}
      align="end"
      items={NAV_SECTIONS.map((section) => ({
        id: section.id,
        label: t(section.labelKey as TranslationKey),
        onSelect: () => window.location.assign(section.href),
      }))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={t("apps.sections.label")}>
          <span className="hidden lg:inline">{t("apps.sections.label")}</span>
          <span className="lg:hidden">{t("apps.sections.short")}</span>
        </Button>
      }
    />
  );
}

export function PortalLayout() {
  const site = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const current = site.nav.find((item) => item.to === pathname);

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        {site.ui.skip}
      </a>

      <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[var(--container-max)] items-center justify-between gap-4 px-4 lg:px-6">
          <Link to="/" className="shrink-0 rounded-md">
            <Brand />
          </Link>

          <nav aria-label={site.ui.menu} className="hidden items-center gap-0.5 lg:flex">
            {site.nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isActive ? "bg-surface-2 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <SectionsMenu />
            <LanguageMenu />
            <ThemeMenu />
            <Link
              to="/contact"
              className="hidden h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg shadow-e1 transition-colors hover:bg-primary-hover sm:inline-flex"
            >
              {site.ui.contactCta}
            </Link>
            <Link
              to="/login"
              className="hidden h-9 items-center rounded-md border border-border-strong bg-surface px-3 text-sm text-fg hover:bg-surface-2 md:inline-flex"
            >
              {site.ui.login}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={site.ui.menu}
              className="rounded-md p-2 text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[var(--container-max)] px-4 pb-16 lg:px-6">
        {pathname !== "/" && current ? (
          <nav aria-label={site.ui.breadcrumb} className="pt-4 text-2xs text-fg-subtle">
            <ol className="flex items-center gap-1">
              <li>
                <Link to="/" className="rounded px-1 py-0.5 hover:text-fg">
                  {site.ui.home}
                </Link>
              </li>
              <li aria-hidden="true" className="text-fg-subtle">
                /
              </li>
              <li>
                <span aria-current="page" className="px-1 font-medium text-fg">
                  {current.label}
                </span>
              </li>
            </ol>
          </nav>
        ) : null}
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          <div className="space-y-2">
            <Brand />
            <p className="max-w-xs text-2xs leading-relaxed text-fg-subtle">{site.ui.footerNote}</p>
          </div>
          <FooterColumn
            title={site.ui.navGroups.ecosystem}
            links={[
              { to: "/ecosystem", label: site.nav[1]?.label ?? "" },
              { to: "/hydroma", label: site.nav[2]?.label ?? "" },
              { to: "/landscape", label: site.nav[3]?.label ?? "" },
            ]}
          />
          <FooterColumn
            title={site.ui.navGroups.community}
            links={[
              { to: "/marketplace", label: site.nav[4]?.label ?? "" },
              { to: "/tourism", label: site.nav[5]?.label ?? "" },
              { to: "/mrv", label: site.nav[6]?.label ?? "" },
            ]}
          />
          <FooterColumn
            title={site.ui.navGroups.contact}
            links={[
              { to: "/knowledge", label: site.nav[7]?.label ?? "" },
              { to: "/about", label: site.pages.about.eyebrow },
              { to: "/contact", label: site.pages.contact.eyebrow },
              { to: "/partner", label: site.pages.partner.eyebrow },
            ]}
          />
        </div>
        <div className="border-t border-border px-4 py-4 lg:px-6">
          <p className="mx-auto w-full max-w-[var(--container-max)] text-2xs text-fg-subtle">
            © {new Date().getFullYear()} {site.ui.footerRights}
          </p>
        </div>
      </footer>

      <dialog
        ref={drawerRef}
        onCancel={() => setOpen(false)}
        aria-label={site.ui.menu}
        className="fixed inset-y-0 m-0 h-dvh max-h-none w-[min(86vw,20rem)] rounded-none border-e border-border bg-surface p-0"
        style={{ insetInlineStart: 0 }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={site.ui.close}
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={site.ui.menu} className="space-y-1 p-3">
          {site.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-surface-2 font-medium text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex gap-2 border-t border-border pt-3">
            <Link to="/contact" onClick={() => setOpen(false)} className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm text-primary-fg">
              {site.ui.contactCta}
            </Link>
            <Link to="/login" onClick={() => setOpen(false)} className="flex-1 rounded-md border border-border-strong px-3 py-2 text-center text-sm text-fg">
              {site.ui.login}
            </Link>
          </div>
        </nav>
      </dialog>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ to: string; label: string }> }) {
  return (
    <div>
      <h2 className="text-2xs font-medium uppercase tracking-wide text-fg-subtle">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-fg-muted hover:text-fg">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
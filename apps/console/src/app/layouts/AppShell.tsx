import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  ChevronLeft,
  Globe2,
  LayoutGrid,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core";
import type { ThemeMode } from "@eco-nojin/frontend-core";
import { usePermissions } from "@eco-nojin/frontend-core";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Dropdown,
  EmptyState,
  Input,
  ToastProvider,
  useToast,
  type MenuItem,
} from "@eco-nojin/ui";
import { NAV_GROUPS, ROUTE_BREADCRUMBS } from "../config/navigation";
import { RoutePermissionGuard } from "@eco-nojin/auth-client";
import { DemoFixtures } from "../../permissions/fixture";
import { useSession } from "../../session/DemoSession";

const SIDEBAR_KEY = "eco.sidebar.collapsed";

function Brand({ compact }: { compact: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg"
      >
        <LayoutGrid className="size-4.5" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-fg">
            {t("common.appName")}
          </span>
          <span className="block truncate text-2xs text-sidebar-muted">
            {t("common.workspace")}
          </span>
        </span>
      ) : null}
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { can } = usePermissions();

  return (
    <nav aria-label={t("common.menu")} className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => !item.permission || can(item.permission));
        if (items.length === 0) return null;
        return (
          <div key={group.labelKey} className="space-y-1.5">
            <p className="px-2 text-2xs font-medium uppercase tracking-wide text-sidebar-muted">
              {t(group.labelKey)}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-active font-medium text-sidebar-fg"
                          : "text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-fg"
                      }`
                    }
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();
  const { user } = useSession();
  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <Link
        to="/settings"
        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-active ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Avatar name={user.name} size="sm" />
        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-2xs font-medium text-sidebar-fg">
              {user.name}
            </span>
            <span className="block truncate text-2xs text-sidebar-muted">
              {t("common.demoUser")}
            </span>
          </span>
        ) : null}
      </Link>
    </div>
  );
}

function OrgSwitcher() {
  const { t } = useI18n();
  const { activeOrg, memberships, setActiveOrg, role } = useSession();
  return (
    <Dropdown
      label={t("orgs.switcher")}
      align="end"
      items={memberships.map((item) => ({
        id: item.organization.id,
        label: `${item.organization.name} · ${t(`roles.${item.membership.role}` as TranslationKey)}`,
        selected: item.organization.id === activeOrg.id,
        icon: <Building2 className="size-4" aria-hidden="true" />,
        onSelect: () => setActiveOrg(item.organization.id),
      }))}
      trigger={
        <Button variant="ghost" size="sm" icon={<Building2 className="size-4" aria-hidden="true" />}>
          <span className="hidden max-w-40 truncate sm:inline">{activeOrg.name}</span>
          <span className="sr-only">
            {t("orgs.current")} · {t(`roles.${role}` as TranslationKey)}
          </span>
        </Button>
      }
    />
  );
}
function LanguageMenu() {
  const { t, locale, locales, setLocale } = useI18n();
  const current = locales.find((item) => item.code === locale);
  const items: MenuItem[] = locales.map((item) => ({
    id: item.code,
    label: `${item.nativeName} — ${item.englishName}`,
    selected: item.code === locale,
    icon: <Globe2 className="size-4" aria-hidden="true" />,
    onSelect: () => setLocale(item.code),
  }));

  return (
    <Dropdown
      label={t("common.language")}
      items={items}
      align="end"
      trigger={
        <Button variant="ghost" size="sm" icon={<Globe2 className="size-4" aria-hidden="true" />}>
          <span className="uppercase">{current?.code ?? locale}</span>
          <span className="sr-only">{t("common.language")}</span>
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
    {
      id: "system",
      label: t("common.system"),
      icon: <Monitor className="size-4" aria-hidden="true" />,
    },
  ];

  return (
    <Dropdown
      label={t("common.theme")}
      items={options.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.icon,
        selected: mode === option.id,
        onSelect: () => setMode(option.id),
      }))}
      align="end"
      trigger={
        <Button
          variant="ghost"
          size="sm"
          icon={
            mode === "dark" ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : mode === "system" ? (
              <Monitor className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )
          }
        >
          <span className="sr-only">{t("common.theme")}</span>
        </Button>
      }
    />
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function UserMenu() {
  const { t } = useI18n();
  const { push } = useToast();
  const { user } = useSession();
  const navigate = useNavigate();
  const userName = user.name;
  const items: MenuItem[] = [
    {
      id: "profile",
      label: t("common.profile"),
      icon: <UserRound className="size-4" aria-hidden="true" />,
      onSelect: () => push({ title: t("common.profile"), description: t("common.demoNote") }),
    },
    {
      id: "settings",
      label: t("common.settings"),
      icon: <Settings className="size-4" aria-hidden="true" />,
      onSelect: () => {
        navigate("/settings");
      },
    },
  ];

  return (
    <Dropdown
      label={t("common.profile")}
      items={items}
      align="end"
      trigger={
        <button
          type="button"
          aria-label={`${t("common.profile")} ${initials(userName)}`}
          className="rounded-full"
        >
          <Avatar name={userName} size="sm" />
        </button>
      }
    />
  );
}

function Breadcrumbs() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const match = Object.keys(ROUTE_BREADCRUMBS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  const keys = (match ? ROUTE_BREADCRUMBS[match] : undefined) ?? ["nav.home"];
  return (
    <nav aria-label={t("common.breadcrumb")} className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-2xs text-fg-subtle">
        {keys.map((key, index) => {
          const isLast = index === keys.length - 1;
          const href = index === 0 ? "/" : undefined;
          return (
            <li key={key} className="flex items-center gap-1">
              {href && !isLast ? (
                <Link to={href} className="rounded px-1 py-0.5 hover:text-fg">
                  {t(key)}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "px-1 font-medium text-fg" : "px-1"}>
                  {t(key)}
                </span>
              )}
              {!isLast ? <ChevronLeft className="rtl-flip size-3" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AppShell() {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      // best effort
    }
  }, [collapsed]);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  const unread = DemoFixtures.notifications.filter((item) => !item.read).length;

  return (
    <ToastProvider>
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        {t("common.skipToContent")}
      </a>

      <div
        className="lg:grid"
        style={{
          gridTemplateColumns: collapsed ? "var(--sidebar-collapsed) minmax(0,1fr)" : "var(--sidebar-width) minmax(0,1fr)",
        }}
      >
        <aside className="sticky top-0 hidden h-dvh flex-col border-e border-sidebar-border bg-sidebar lg:flex">
          <div className="flex h-[var(--header-height)] items-center justify-between gap-2 border-b border-sidebar-border px-3">
            <Brand compact={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
              className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-fg"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <SidebarNav />
          <SidebarFooter collapsed={collapsed} />
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-col">
          <header className="sticky top-0 z-[var(--z-header)] flex h-[var(--header-height)] items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur lg:px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("common.openMenu")}
              className="rounded-md p-2 text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface px-3 text-start text-sm text-fg-subtle hover:border-primary/60 md:flex"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="truncate">{t("common.searchPlaceholder")}</span>
            </button>

            <div className="ms-auto flex items-center gap-1.5">
              <OrgSwitcher />
              <LanguageMenu />
              <ThemeMenu />
              <Link
                to="/notifications"
                aria-label={t("common.notifications")}
                className="relative inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <Bell className="size-4" aria-hidden="true" />
                {unread > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute end-2 top-2 size-1.5 rounded-full bg-[var(--chart-3)]"
                  />
                ) : null}
              </Link>
              <UserMenu />
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-[var(--container-max)] flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <Breadcrumbs />
            <RoutePermissionGuard />
          </main>

          <footer className="border-t border-border px-4 py-3 text-2xs text-fg-subtle lg:px-6">
            <div className="mx-auto flex max-w-[var(--container-max)] flex-wrap items-center justify-between gap-2">
              <span>
                {t("common.appName")} · {t("common.workspace")} ·{" "}
                <span className="numeric">{DemoFixtures.version}</span>
              </span>
              <Badge tone="warning">{t("common.demoNote")}</Badge>
            </div>
          </footer>
        </div>
      </div>

      <dialog
        ref={drawerRef}
        onCancel={() => setMobileOpen(false)}
        aria-label={t("common.menu")}
        className="fixed inset-y-0 m-0 h-dvh max-h-none w-[min(86vw,20rem)] rounded-none border-e border-sidebar-border bg-sidebar p-0 text-sidebar-fg"
        style={{ insetInlineStart: 0 }}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between border-b border-sidebar-border px-3">
          <Brand compact={false} />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t("common.closeMenu")}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex h-[calc(100dvh-var(--header-height))] flex-col">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter collapsed={false} />
        </div>
      </dialog>

      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("common.search")}
        description={t("common.demoNote")}
      >
        <Input autoFocus placeholder={t("common.searchPlaceholder")} aria-label={t("common.search")} />
        <div className="mt-4">
          <EmptyState title={t("common.emptyTitle")} body={t("common.emptyBody")} />
        </div>
      </Dialog>
    </div>
    </ToastProvider>
  );
}
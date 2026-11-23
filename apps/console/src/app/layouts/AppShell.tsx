import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Globe2,
  LogOut,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { useTheme, usePermissions } from "@eco-nojin/frontend-core";
import type { ThemeMode } from "@eco-nojin/frontend-core";
import { AppShell as AppShellShell, Breadcrumbs, type NavGroup } from "@eco-nojin/app-shell";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Dropdown,
  EmptyState,
  Input,
  ToastProvider,
  type MenuItem,
} from "@eco-nojin/ui";
import { NAV_GROUPS, ROUTE_BREADCRUMBS } from "../config/navigation";
import { RoutePermissionGuard } from "@eco-nojin/auth-client";
import { useHealth, useNotifications } from "../../hooks/useConsoleData";
import { useSession } from "../../session/Session";

function useNavGroups(): NavGroup[] {
  const { t } = useI18n();
  return NAV_GROUPS.map((group) => ({
    label: t(group.labelKey),
    items: group.items.map((item) => ({
      to: item.to,
      label: t(item.labelKey),
      icon: <item.icon className="size-4" aria-hidden="true" />,
      end: item.end,
      permission: item.permission,
    })),
  }));
}

function useBreadcrumbs() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const match = Object.keys(ROUTE_BREADCRUMBS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  const keys = (match ? ROUTE_BREADCRUMBS[match] : undefined) ?? ["nav.home"];
  return keys.map((key, index) => ({ label: t(key), to: index === 0 ? "/" : undefined }));
}

function SidebarFooter() {
  const { user } = useSession();
  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <Link
        to="/settings"
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-active"
      >
        <Avatar name={user.name} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2xs font-medium text-sidebar-fg">{user.name}</span>
          <span className="block truncate text-2xs text-sidebar-muted" dir="ltr">{user.email}</span>
        </span>
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
  const options: Array<{ id: ThemeMode; label: string; icon: ReactNode }> = [
    { id: "light", label: t("common.light"), icon: <Sun className="size-4" aria-hidden="true" /> },
    { id: "dark", label: t("common.dark"), icon: <Moon className="size-4" aria-hidden="true" /> },
    { id: "system", label: t("common.system"), icon: <Monitor className="size-4" aria-hidden="true" /> },
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
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const userName = user.name;
  const items: MenuItem[] = [
    {
      id: "profile",
      label: t("common.profile"),
      icon: <UserRound className="size-4" aria-hidden="true" />,
      onSelect: () => navigate("/profile"),
    },
    {
      id: "settings",
      label: t("common.settings"),
      icon: <Settings className="size-4" aria-hidden="true" />,
      onSelect: () => {
        navigate("/settings");
      },
    },
    {
      id: "signout",
      label: t("common.signOut"),
      icon: <LogOut className="size-4" aria-hidden="true" />,
      onSelect: () => {
        void logout();
      },
    },
  ];
  return (
    <Dropdown
      label={t("common.profile")}
      items={items}
      align="end"
      trigger={
        <button type="button" aria-label={`${t("common.profile")} ${initials(userName)}`} className="rounded-full">
          <Avatar name={userName} size="sm" />
        </button>
      }
    />
  );
}

export function AppShell() {
  const { t } = useI18n();
  const { can } = usePermissions();
  const groups = useNavGroups();
  const crumbs = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const unread = notifications?.unread ?? 0;
  const { data: health } = useHealth();

  return (
    <ToastProvider>
      <AppShellShell
        brand={t("common.appName")}
        groups={groups}
        can={can}
        content={<RoutePermissionGuard />}
        breadcrumbs={<Breadcrumbs items={crumbs} label={t("common.breadcrumb")} />}
        sidebarFooter={<SidebarFooter />}
        headerActions={
          <>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface px-3 text-start text-sm text-fg-subtle hover:border-primary/60 md:flex"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="truncate">{t("common.searchPlaceholder")}</span>
            </button>
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
                <span aria-hidden="true" className="absolute end-2 top-2 size-1.5 rounded-full bg-[var(--chart-3)]" />
              ) : null}
            </Link>
            <UserMenu />
          </>
        }
        footer={
          <>
            <span>
              {t("common.appName")} · {t("common.workspace")} · <span className="numeric">{health?.version ?? "…"}</span>
            </span>
            <Badge tone="success">{t("common.liveApi")}</Badge>
          </>
        }
        labels={{
          skipToContent: t("common.skipToContent"),
          menu: t("common.openMenu"),
          closeMenu: t("common.closeMenu"),
          collapseSidebar: t("common.collapseSidebar"),
          expandSidebar: t("common.expandSidebar"),
          navigation: t("common.menu"),
          breadcrumb: t("common.breadcrumb"),
        }}
        storageKey="eco.sidebar.collapsed"
      />

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title={t("common.search")} description={t("common.demoNote")}>
        <Input autoFocus placeholder={t("common.searchPlaceholder")} aria-label={t("common.search")} />
        <div className="mt-4">
          <EmptyState title={t("common.emptyTitle")} body={t("common.emptyBody")} />
        </div>
      </Dialog>
    </ToastProvider>
  );
}
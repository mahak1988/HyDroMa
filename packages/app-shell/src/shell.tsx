/*
 * Eco Nojin shared application shell.
 *
 * Router-aware (react-router-dom) but content-agnostic: an app supplies its brand,
 * navigation config, header actions and content; the shell owns the responsive
 * layout, sidebar, mobile drawer, header, breadcrumbs and page-header structure.
 *
 * Design constraints honoured:
 *  - semantic design tokens only (no raw colours / hex);
 *  - logical CSS (RTL/LTR) — border-e / border-s, inset-inline-start;
 *  - native landmarks (header/nav/main/footer) + skip link + focus-visible;
 *  - reduced-motion respected via the design-system base layer;
 *  - no app-to-app imports, no business logic, no i18n coupling (labels are strings).
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

export type NavItem = {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean;
  permission?: string;
  badge?: number;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type ShellLabels = {
  skipToContent: string;
  menu: string;
  closeMenu: string;
  collapseSidebar: string;
  expandSidebar: string;
  navigation: string;
  breadcrumb: string;
};

const DEFAULT_LABELS: ShellLabels = {
  skipToContent: "Skip to content",
  menu: "Menu",
  closeMenu: "Close menu",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  navigation: "Main navigation",
  breadcrumb: "Breadcrumb",
};

export type AppShellProps = {
  brand: ReactNode;
  groups: NavGroup[];
  content: ReactNode;
  can?: (permission: string) => boolean;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  breadcrumbs?: ReactNode;
  footer?: ReactNode;
  labels?: Partial<ShellLabels>;
  storageKey?: string;
};

const COLLAPSE_ICON = (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="4" width="14" height="12" rx="1.5" />
    <path d="M8 4v12" />
  </svg>
);
const EXPAND_ICON = (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <rect x="3" y="4" width="14" height="12" rx="1.5" />
    <path d="M12 4v12M8 8l-2 2 2 2" />
  </svg>
);
const MENU_ICON = (
  <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 5h14M3 10h14M3 15h14" />
  </svg>
);
const CLOSE_ICON = (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);

export function AppNav({
  groups,
  can,
  onNavigate,
  label,
}: {
  groups: NavGroup[];
  can?: (permission: string) => boolean;
  onNavigate?: () => void;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => {
        const items = group.items.filter((item) => !item.permission || (can ? can(item.permission) : true));
        if (items.length === 0) return null;
        return (
          <div key={group.label} className="space-y-1.5">
            <p className="px-2 text-2xs font-medium uppercase tracking-wide text-sidebar-muted">{group.label}</p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to + item.label}>
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
                    {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                    <span className="truncate">{item.label}</span>
                    {typeof item.badge === "number" && item.badge > 0 ? (
                      <span className="ms-auto rounded-pill bg-primary-soft px-1.5 text-2xs font-medium text-primary-soft-fg">
                        {item.badge}
                      </span>
                    ) : null}
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

export function AppSidebar({
  brand,
  groups,
  can,
  onNavigate,
  collapsed,
  onToggle,
  footer,
  labels,
}: {
  brand: ReactNode;
  groups: NavGroup[];
  can?: (permission: string) => boolean;
  onNavigate?: () => void;
  collapsed: boolean;
  onToggle: () => void;
  footer?: ReactNode;
  labels: ShellLabels;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-e border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-[var(--header-height)] items-center justify-between gap-2 border-b border-sidebar-border px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg">
            <svg viewBox="0 0 20 20" className="size-4.5" fill="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="6" height="6" rx="1" />
              <rect x="11" y="3" width="6" height="6" rx="1" />
              <rect x="3" y="11" width="6" height="6" rx="1" />
              <rect x="11" y="11" width="6" height="6" rx="1" />
            </svg>
          </span>
          {collapsed ? null : <span className="min-w-0 truncate text-sm font-semibold text-sidebar-fg">{brand}</span>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? labels.expandSidebar : labels.collapseSidebar}
          className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-fg"
        >
          {collapsed ? EXPAND_ICON : COLLAPSE_ICON}
        </button>
      </div>
      <AppNav groups={groups} can={can} onNavigate={onNavigate} label={labels.navigation} />
      {footer}
    </aside>
  );
}

export function AppHeader({
  onMenuClick,
  actions,
  labels,
}: {
  onMenuClick: () => void;
  actions?: ReactNode;
  labels: ShellLabels;
}) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] flex h-[var(--header-height)] items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur lg:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={labels.menu}
        className="rounded-md p-2 text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
      >
        {MENU_ICON}
      </button>
      <div className="ms-auto flex items-center gap-1.5">{actions}</div>
    </header>
  );
}

export function AppShell({
  brand,
  groups,
  content,
  can,
  headerActions,
  sidebarFooter,
  breadcrumbs,
  footer,
  labels,
  storageKey = "eco.shell.sidebar.collapsed",
}: AppShellProps) {
  const l: ShellLabels = { ...DEFAULT_LABELS, ...labels };
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {
      /* best effort */
    }
  }, [collapsed, storageKey]);

  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="skip-link">
        {l.skipToContent}
      </a>

      <div
        className="lg:grid"
        style={{
          gridTemplateColumns: collapsed
            ? "var(--sidebar-collapsed) minmax(0,1fr)"
            : "var(--sidebar-width) minmax(0,1fr)",
        }}
      >
        <AppSidebar
          brand={brand}
          groups={groups}
          can={can}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          footer={sidebarFooter}
          labels={l}
        />

        <div className="flex min-h-dvh min-w-0 flex-col">
          <AppHeader onMenuClick={() => setMobileOpen(true)} actions={headerActions} labels={l} />

          <main id="main" className="mx-auto w-full max-w-[var(--container-max)] flex-1 px-4 py-5 lg:px-6 lg:py-6">
            {breadcrumbs}
            {content}
          </main>

          {footer ? (
            <footer className="border-t border-border px-4 py-3 text-2xs text-fg-subtle lg:px-6">
              <div className="mx-auto flex max-w-[var(--container-max)] flex-wrap items-center justify-between gap-2">
                {footer}
              </div>
            </footer>
          ) : null}
        </div>
      </div>

      <dialog
        ref={drawerRef}
        onCancel={() => setMobileOpen(false)}
        aria-label={l.menu}
        className="fixed inset-y-0 m-0 h-dvh max-h-none w-[min(86vw,20rem)] rounded-none border-e border-sidebar-border bg-sidebar p-0 text-sidebar-fg"
        style={{ insetInlineStart: 0 }}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between border-b border-sidebar-border px-3">
          <span className="min-w-0 truncate text-sm font-semibold text-sidebar-fg">{brand}</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={l.closeMenu}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-fg"
          >
            {CLOSE_ICON}
          </button>
        </div>
        <div className="flex h-[calc(100dvh-var(--header-height))] flex-col">
          <AppNav groups={groups} can={can} onNavigate={() => setMobileOpen(false)} label={l.navigation} />
          {sidebarFooter}
        </div>
      </dialog>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle ? <p className="max-w-2xl text-xs text-fg-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-2xs text-fg-subtle">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label + index} className="flex items-center gap-1">
              {item.to && !isLast ? (
                <Link to={item.to} className="rounded px-1 py-0.5 hover:text-fg">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "px-1 font-medium text-fg" : "px-1"}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <svg viewBox="0 0 20 20" className="rtl-flip size-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M12 5l-5 5 5 5" />
                </svg>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
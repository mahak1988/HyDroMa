import type { CSSProperties } from "react";
import { APPS, isUnified, type AppId } from "@eco-nojin/configuration";
import { useI18n, type TranslationKey } from "@eco-nojin/i18n";

/**
 * In-app switcher between the unified apps.
 *
 * It renders **only** when the build is served under a path prefix (the unified
 * host). In a standalone app (`BASE_URL="/"`) there is nowhere to switch to, so
 * the switcher stays out of the way — and out of the e2e baseline.
 *
 * Links are plain anchors: crossing an app boundary is a document navigation,
 * not a client-side route change, because each app is its own bundle.
 */
const SHORT_KEYS: Record<AppId, TranslationKey> = {
  home: "apps.home.short",
  portal: "apps.portal.short",
  console: "apps.console.short",
  "scientific-workspace": "apps.science.short",
  marketplace: "apps.market.short",
  tourism: "apps.tourism.short",
  brand: "apps.brand.short",
  platform: "apps.platform.short",
  "field-collection": "apps.field.short",
};

const bar: CSSProperties = {
  position: "fixed",
  insetInline: 0,
  bottom: "max(10px, env(safe-area-inset-bottom))",
  display: "flex",
  justifyContent: "center",
  zIndex: 60,
  pointerEvents: "none",
};

const rail: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-1, 4px)",
  maxWidth: "min(96vw, 760px)",
  overflowX: "auto",
  padding: "var(--space-1, 4px)",
  background: "var(--surface, #fff)",
  border: "1px solid var(--border, #d5dde0)",
  borderRadius: "var(--radius-pill, 999px)",
  boxShadow: "var(--shadow-e3, 0 8px 24px rgb(8 13 11 / 0.12))",
  pointerEvents: "auto",
  scrollbarWidth: "thin",
};

function chipStyle(active: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "var(--radius-pill, 999px)",
    fontSize: "var(--text-xs, 0.75rem)",
    fontWeight: 500,
    lineHeight: 1.4,
    textDecoration: "none",
    whiteSpace: "nowrap",
    color: active ? "var(--primary-fg, #fff)" : "var(--fg-muted, #55665e)",
    background: active ? "var(--primary, #0f6b4f)" : "transparent",
  };
}

export function AppSwitcher({ current }: { current: AppId }) {
  const { t } = useI18n();

  if (!isUnified(import.meta.env.BASE_URL)) return null;

  return (
    <>
      {/* Reserve the height of the fixed rail so it never covers content. */}
      <div aria-hidden="true" style={{ height: 56 }} />
      <div style={bar}>
      <nav aria-label={t("switcher.label")} style={rail}>
        {APPS.map((app) => {
          const active = app.id === current;
          return (
            <a
              key={app.id}
              href={app.path}
              style={chipStyle(active)}
              aria-current={active ? "page" : undefined}
              title={t(app.titleKey as TranslationKey)}
            >
              {t(SHORT_KEYS[app.id])}
            </a>
          );
        })}
      </nav>
      </div>
    </>
  );
}
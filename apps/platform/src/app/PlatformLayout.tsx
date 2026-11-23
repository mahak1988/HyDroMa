import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button } from "@eco-nojin/ui";
import { Icon } from "@eco-nojin/icons";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import { PAGES, SECTIONS, pageById, pagesOf, type SectionId } from "../content/pages";
import { UI, t } from "../content/ui";

const OVERVIEW = pageById("overview");

export function PlatformLayout() {
  const { locale, setLocale, locales } = useI18n();
  const { mode, setMode } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const current = useMemo(() => {
    const path = location.pathname;
    const exact = [...PAGES].sort((a, b) => b.path.length - a.path.length).find((page) => page.path && path.endsWith(`/${page.path}`));
    if (exact) return exact;
    const dynamic = PAGES.find((page) => page.path.includes(":") && path.includes(`/${page.path.split("/:")[0]}/`));
    if (dynamic) return dynamic;
    return path.replace(/\/+$/u, "").endsWith("platform") ? OVERVIEW : OVERVIEW;
  }, [location.pathname]);

  const section = SECTIONS.find((item) => item.id === current.section) ?? SECTIONS[0]!;

  return (
    <div className={`pl-app${open ? " is-open" : ""}`}>
      <a className="skip-link" href="#main">
        {t(UI.skip, locale)}
      </a>

      <aside className="pl-sidebar" aria-label={t(UI.sections, locale)}>
        <div className="pl-brand">
          <span className="pl-brandMark" aria-hidden="true">
            <Icon name="water" size={20} />
          </span>
          <span>
            <strong>{t({ fa: "اکو نوژین", en: "Eco Nojin", ar: "إيكو نوشين" }, locale)}</strong>
            <small>{t({ fa: "پلتفرم یکپارچه", en: "Unified platform", ar: "منصة موحدة" }, locale)}</small>
          </span>
        </div>

        <nav className="pl-nav">
          <div className="pl-search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="pl-searchInput"
              aria-label="Search pages"
            />
          </div>
          {SECTIONS.map((item) => {
            const pages = pagesOf(item.id as SectionId)
              .filter((page) => page.path !== "")
              .filter((page) => !query || t(page.title, locale).toLowerCase().includes(query.toLowerCase()) || page.path.toLowerCase().includes(query.toLowerCase()));
            if (query && pages.length === 0 && item.id !== "overview") return null;
            const isOpen = query ? true : collapsed[item.id] !== true;
            const active = current.section === item.id;
            return (
              <div key={item.id} className={`pl-navGroup${active ? " is-active" : ""}`}>
                <button
                  type="button"
                  className="pl-navHead"
                  aria-expanded={isOpen}
                  onClick={() => setCollapsed((value) => ({ ...value, [item.id]: isOpen }))}
                >
                  <Icon name={item.icon as never} size={16} />
                  <span>{t(item.label, locale)}</span>
                  <span aria-hidden="true" className="pl-caret">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <ul className="pl-navList">
                    {item.id === "overview" ? (
                      <li>
                        <Link to="/" className={location.pathname.replace(/\/+$/u, "").endsWith("platform") ? "is-current" : ""}>
                          {t(OVERVIEW.title, locale)}
                        </Link>
                      </li>
                    ) : null}
                    {pages.map((page) => (
                      <li key={page.id}>
                        <Link
                          to={`/${page.path}`}
                          className={page.id === current.id ? "is-current" : ""}
                          aria-current={page.id === current.id ? "page" : undefined}
                        >
                          {t(page.title, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="pl-sideFoot">
          <Badge tone="warning" dot>
            {t(UI.demo, locale)}
          </Badge>
          <p>{t(UI.demoNote, locale)}</p>
        </div>
      </aside>

      <div className="pl-shell">
        <header className="pl-header">
          <button
            type="button"
            className="pl-menuBtn"
            aria-label={t(UI.menu, locale)}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name="chart" size={18} />
          </button>

          <nav aria-label={t(UI.breadcrumb, locale)} className="pl-crumbs">
            <span>{t(section.label, locale)}</span>
            {current.id === "overview" ? null : (
              <>
                <span aria-hidden="true">/</span>
                <span className="pl-crumbCurrent">{t(current.title, locale)}</span>
              </>
            )}
          </nav>

          <div className="pl-headActions">
            <div className="pl-seg" role="group" aria-label={t(UI.language, locale)}>
              {locales
                .filter((item) => item.enabled)
                .map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    aria-pressed={item.code === locale}
                    onClick={() => setLocale(item.code)}
                  >
                    {item.code.toUpperCase()}
                  </button>
                ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
              {t({ fa: "پوسته", en: "Theme", ar: "السمة" }, locale)}
            </Button>
          </div>
        </header>

        <main id="main" className="pl-main">
          <Outlet />
        </main>

        <footer className="pl-footer">
          <span>{t({ fa: "پلتفرم اکو نوژین", en: "Eco Nojin platform", ar: "منصة إيكو نوشين" }, locale)}</span>
          <span aria-hidden="true">·</span>
          <span>v0.1.0</span>
        </footer>
      </div>
    </div>
  );
}

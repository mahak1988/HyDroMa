import { useMemo, useState } from "react";
import { useI18n, type TranslationKey } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import { Alert, Badge, Button, Card, Input } from "@eco-nojin/ui";

/**
 * Design-system showcase for the v1.1 identity.
 *
 * The palette is read from the live CSS variables — the same tokens every app
 * consumes — so this page cannot drift from the product. The light/dark table
 * below is the reference pair set from the specification.
 */
type Tab = "tokens" | "components" | "themes" | "identity" | "demo";

const TABS: Array<{ id: Tab; key: TranslationKey }> = [
  { id: "tokens", key: "brand.tokens" },
  { id: "components", key: "brand.components" },
  { id: "themes", key: "brand.themes" },
  { id: "identity", key: "brand.identity" },
  { id: "demo", key: "brand.demo" },
];

const IDENTITY_ASSETS = [
  "eco-nojin-option-01",
  "eco-nojin-option-02",
  "eco-nojin-option-03",
  "hydroma-option-01",
  "hydroma-option-02",
  "hydroma-option-03",
  "marketplace-option-01",
  "marketplace-option-02",
  "marketplace-option-03",
];

const BRAND_TOKENS: Array<{ token: string; label: string }> = [
  { token: "--brand-primary", label: "Royal Aubergine" },
  { token: "--brand-accent", label: "Burnt Terracotta" },
  { token: "--brand-secondary", label: "Antique Champagne" },
  { token: "--brand-espresso", label: "Deep Espresso" },
  { token: "--brand-ivory", label: "Warm Ivory" },
  { token: "--brand-porcelain", label: "Porcelain White" },
  { token: "--brand-taupe", label: "Warm Taupe" },
  { token: "--brand-slate", label: "Deep Slate" },
  { token: "--brand-rose", label: "Dusty Rose" },
  { token: "--brand-champagne", label: "Soft Champagne" },
];

const SEMANTIC_TOKENS: Array<{ token: string; label: string }> = [
  { token: "--success", label: "Forest Success" },
  { token: "--warning", label: "Deep Ochre" },
  { token: "--danger", label: "Deep Red" },
  { token: "--info", label: "Technical Blue" },
  { token: "--disabled", label: "Muted Gray" },
];

const SERVICE_TOKENS: Array<{ token: string; label: string }> = [
  { token: "--service-portal", label: "Portal" },
  { token: "--service-hydroma", label: "HyDroMA" },
  { token: "--service-landscape", label: "Landscape" },
  { token: "--service-agriculture", label: "Agriculture" },
  { token: "--service-mrv", label: "MRV" },
  { token: "--service-projects", label: "Projects" },
  { token: "--service-marketplace", label: "Marketplace" },
  { token: "--service-tourism", label: "Tourism" },
  { token: "--service-daneshyar", label: "Daneshyar" },
  { token: "--service-tasmimyar", label: "Tasmimyar" },
  { token: "--service-finance", label: "Finance" },
  { token: "--service-console", label: "Console" },
  { token: "--service-community", label: "Community" },
];

/** Reference pairs from the specification; the live values come from CSS. */
const THEME_PAIRS: Array<{ token: string; light: string; dark: string }> = [
  { token: "Background", light: "#F7F2E9", dark: "#211D22" },
  { token: "Surface", light: "#FFFCF7", dark: "#2C262D" },
  { token: "Surface elevated", light: "#FFFFFF", dark: "#382F38" },
  { token: "Primary text", light: "#2D2523", dark: "#F6F0E8" },
  { token: "Secondary text", light: "#665B55", dark: "#C4B8B1" },
  { token: "Brand primary", light: "#5A3D50", dark: "#C59AAE" },
  { token: "Accent", light: "#9C4F3B", dark: "#D28B72" },
  { token: "Border", light: "#DED5C9", dark: "#514650" },
];

function readToken(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function BrandApp() {
  const { t, locale } = useI18n();
  const loc = (value: { fa: string; en: string; ar: string }): string =>
    locale === "fa" ? value.fa : locale === "ar" ? value.ar : value.en;
  const { mode, setMode } = useTheme();
  const [tab, setTab] = useState<Tab>("tokens");

  // Re-read whenever the theme changes: the swatches show the live theme.
  const live = useMemo(
    () => new Map([...BRAND_TOKENS, ...SEMANTIC_TOKENS, ...SERVICE_TOKENS].map((item) => [item.token, readToken(item.token)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, locale],
  );

  return (
    <div className="brand">
      <header className="brand__bar">
        <a className="brand__back" href="/">
          ← {t("brand.back")}
        </a>
        <h1>{t("brand.intro")}</h1>
        <span className="brand__version">v1.1 · Warm Luxury</span>
      </header>

      <nav className="brand__tabs" aria-label={t("brand.intro")}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="brand__tab"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </nav>

      <main className="brand__body">
        {tab === "tokens" ? (
          <section aria-label={t("brand.tokens")}>
            <h2 className="brand__groupTitle">{t("brand.tokens")}</h2>
            <ul className="brand__swatches">
              {[...BRAND_TOKENS, ...SEMANTIC_TOKENS, ...SERVICE_TOKENS].map((item) => (
                <li key={item.token} className="brand__swatch">
                  <span className="brand__chip" style={{ background: live.get(item.token) }} aria-hidden="true" />
                  <code dir="ltr">{item.token}</code>
                  <span className="brand__value" dir="ltr">{live.get(item.token)}</span>
                  <span className="brand__desc">{item.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === "components" ? (
          <section className="brand__stack" aria-label={t("brand.components")}>
            <div className="brand__row">
              <Button variant="primary">{t("brand.components")}</Button>
              <Button>Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Loading</Button>
            </div>
            <div className="brand__row">
              <Badge tone="neutral">neutral</Badge>
              <Badge tone="success" dot>success</Badge>
              <Badge tone="warning" dot>warning</Badge>
              <Badge tone="danger" dot>danger</Badge>
              <Badge tone="info">info</Badge>
            </div>
            <div className="brand__row">
              <Input id="brand-input" placeholder="name@example.org" aria-label="email" />
            </div>
            <Alert tone="info" title={t("brand.note")}>
              {t("brand.intro")}
            </Alert>
            <Card>
              <h2>{t("brand.tokens")}</h2>
              <p className="brand__desc">{t("brand.note")}</p>
            </Card>
          </section>
        ) : null}

        {tab === "themes" ? (
          <section aria-label={t("brand.themes")} className="brand__stack">
            <div className="brand__row">
              <Button size="sm" variant={mode === "light" ? "primary" : "secondary"} onClick={() => setMode("light")}>
                Light
              </Button>
              <Button size="sm" variant={mode === "dark" ? "primary" : "secondary"} onClick={() => setMode("dark")}>
                Dark
              </Button>
              <span className="brand__desc">
                {loc({
                  fa: "تم روشن پیش‌فرض است؛ تم تاریک جداگانه تنظیم شده، نه معکوس.",
                  en: "Light is the default; dark is tuned separately, never inverted.",
                  ar: "السمة الفاتحة هي الافتراضية؛ الداكنة مضبوطة بشكل مستقل.",
                })}
              </span>
            </div>

            <table className="brand__table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Light</th>
                  <th>Dark</th>
                </tr>
              </thead>
              <tbody>
                {THEME_PAIRS.map((pair) => (
                  <tr key={pair.token}>
                    <td>{pair.token}</td>
                    <td>
                      <span className="brand__dot" style={{ background: pair.light }} aria-hidden="true" />
                      <code dir="ltr">{pair.light}</code>
                    </td>
                    <td>
                      <span className="brand__dot" style={{ background: pair.dark }} aria-hidden="true" />
                      <code dir="ltr">{pair.dark}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === "identity" ? (
          <section aria-label={t("brand.identity")}>
            <ul className="brand__identity">
              {IDENTITY_ASSETS.map((asset) => (
                <li key={asset}>
                  <img src={`${import.meta.env.BASE_URL}identity/${asset}.svg`} alt={asset} loading="lazy" />
                  <code dir="ltr">{asset}</code>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === "demo" ? (
          <section aria-label={t("brand.demo")}>
            <iframe
              className="brand__frame"
              title={t("brand.demo")}
              src={`${import.meta.env.BASE_URL}demo.html`}
              loading="lazy"
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
